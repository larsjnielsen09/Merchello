/**
 * @ngdoc controller
 * @name Merchello.Backoffice.OffersListController
 * @function
 *
 * @description
 * The controller for offers list view controller
 */
angular.module('merchello').controller('Merchello.Backoffice.OfferEditController',
    ['$scope', '$routeParams', '$location', 'assetsService', 'dialogService', 'eventsService', 'notificationsService', 'settingsResource', 'marketingResource', 'merchelloTabsFactory',
        'dialogDataFactory', 'settingDisplayBuilder', 'offerProviderDisplayBuilder', 'offerSettingsDisplayBuilder', 'offerComponentDefinitionDisplayBuilder',
    function($scope, $routeParams, $location, assetsService, dialogService, eventsService, notificationsService, settingsResource, marketingResource, merchelloTabsFactory,
             dialogDataFactory, settingDisplayBuilder, offerProviderDisplayBuilder, offerSettingsDisplayBuilder, offerComponentDefinitionDisplayBuilder) {

        $scope.loaded = false;
        $scope.preValuesLoaded = false;
        $scope.offerSettings = {};
        $scope.context = 'create';
        $scope.tabs = {};
        $scope.settings = {};
        $scope.offerProvider = {};
        $scope.allComponents = [];

        // exposed methods
        $scope.save = saveOffer;
        $scope.toggleOfferExpires = toggleOfferExpires;
        $scope.openDeleteOfferDialog = openDeleteOfferDialog;

        var eventName = 'merchello.offercomponentcollection.changed';

        /**
         * @ngdoc method
         * @name init
         * @function
         *
         * @description
         * Initializes the controller
         */
        function init() {
            eventsService.on('merchello.offercomponentcollection.changed', onComponentCollectionChanged);
            loadSettings();
        }

        /**
         * @ngdoc method
         * @name loadSettings
         * @function
         *
         * @description
         * Loads in store settings from server into the scope.  Called in init().
         */
        function loadSettings() {
            var promiseSettings = settingsResource.getAllSettings();
            promiseSettings.then(function(settings) {
                $scope.settings = settingDisplayBuilder.transform(settings);
                loadOfferProviders();
            }, function (reason) {
                notificationsService.error("Settings Load Failed", reason.message);
            });
        }

        /**
         * @ngdoc method
         * @name loadOfferProviders
         * @function
         *
         * @description
         * Loads the offer providers and sets the provider for this offer type
         */
        function loadOfferProviders() {
            var providersPromise = marketingResource.getOfferProviders();
            providersPromise.then(function(providers) {
                var offerProviders = offerProviderDisplayBuilder.transform(providers);
                $scope.offerProvider = _.find(offerProviders, function(provider) {
                    return provider.backOfficeTree.routeId === 'coupons';
                });
                var key = $routeParams.id;
               loadOfferComponents($scope.offerProvider.key, key);
            }, function(reason) {
                notificationsService.error("Offer providers load failed", reason.message);
            });
        }

        function loadOfferComponents(offerProviderKey, key) {

            var componentPromise = marketingResource.getAvailableOfferComponents(offerProviderKey);
            componentPromise.then(function(components) {
                $scope.allComponents = offerComponentDefinitionDisplayBuilder.transform(components);
                console.info($scope.allComponents);
                loadOffer(key);
            }, function(reason) {
                notificationsService.error("Failted to load offer offer components", reason.message);
            });
        }

        /**
         * @ngdoc method
         * @name loadOffer
         * @function
         *
         * @description
         * Loads in offer (in this case a coupon)
         */
        function loadOffer(key) {

            if (key === 'create' || key === '' || key === undefined) {
                $scope.context = 'create';
                $scope.offerSettings = offerSettingsDisplayBuilder.createDefault();
                setDefaultDates(new Date());
                $scope.offerSettings.offerProviderKey = $scope.offerProvider.key;
                createTabs(key);
                $scope.preValuesLoaded = true;
                $scope.loaded = true;

            } else {
                $scope.context = 'existing';
                var offerSettingsPromise = marketingResource.getOfferSettings(key);
                offerSettingsPromise.then(function(settings) {
                    $scope.offerSettings = offerSettingsDisplayBuilder.transform(settings);
                    createTabs(key);
                    if ($scope.offerSettings.offerStartsDate === '0001-01-01' || !$scope.offerSettings.offerExpires) {
                        setDefaultDates(new Date());
                    } else {
                        $scope.offerSettings.offerStartsDate = $scope.offerSettings.offerStartsDateLocalDateString();
                        $scope.offerSettings.offerEndsDate = $scope.offerSettings.offerEndsDateLocalDateString();
                    }
                    $scope.preValuesLoaded = true;
                    $scope.loaded = true;
                }, function(reason) {
                    notificationsService.error("Failted to load offer settings", reason.message);
                });
            }
        }



        function createTabs(key) {
            $scope.tabs = merchelloTabsFactory.createMarketingTabs();
            $scope.tabs.appendOfferTab(key, $scope.offerProvider.backOfficeTree);
            $scope.tabs.setActive('offer');
        }

        function toggleOfferExpires() {
            $scope.offerSettings.offerExpires = !$scope.offerSettings.offerExpires;
        }

        function saveOffer() {
            var offerPromise;
            var isNew = false;
            $scope.preValuesLoaded = false;
            if ($scope.context === 'create' || $scope.offerSettings.key === '') {
                isNew = true;
                offerPromise = marketingResource.newOfferSettings($scope.offerSettings);
            } else {
                offerPromise = marketingResource.saveOfferSettings($scope.offerSettings);
            }
            offerPromise.then(function(settings) {
                notificationsService.success("Successfully saved the coupon.");
                if (isNew) {
                    $location.url($scope.offerProvider.editorUrl(settings.key), true);
                } else {
                    loadOffer(settings.key);
                }
            }, function(reason) {
                notificationsService.error("Failed to save coupon", reason.message);
            });
        }


        function openDeleteOfferDialog() {
            var dialogData = {};
            dialogData.name = 'Coupon with offer code: ' + $scope.offerSettings.name;
            dialogService.open({
                template: '/App_Plugins/Merchello/Backoffice/Merchello/Dialogs/delete.confirmation.html',
                show: true,
                callback: processDeleteOfferConfirm,
                dialogData: dialogData
            });
        }

        function processDeleteOfferConfirm(dialogData) {
            var promiseDelete = marketingResource.deleteOfferSettings($scope.offerSettings);
            promiseDelete.then(function() {
                $location.url('/merchello/merchello/offerslist/manage', true);
            }, function(reason) {
                notificationsService.error("Failed to delete coupon", reason.message);
            });
        }

        /**
         * @ngdoc method
         * @name setDefaultDates
         * @function
         *
         * @description
         * Sets the default dates
         */
        function setDefaultDates(actual) {
            var month = actual.getMonth() + 1 == 0 ? 11 : actual.getMonth() + 1;
            var start = new Date(actual.getFullYear(), actual.getMonth(), actual.getDate());
            var end = new Date(actual.getFullYear(), month, actual.getDate());

            $scope.offerSettings.offerStartsDate = start.toLocaleDateString();
            $scope.offerSettings.offerEndsDate = end.toLocaleDateString();
        }

        function onComponentCollectionChanged() {
            if(!$scope.offerSettings.hasRewards()) {
                $scope.offerSettings.active = false;
            }
        }

        // Initializes the controller
        init();
    }]);