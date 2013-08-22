﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Merchello.Core;

namespace Merchello.Web
{
    internal class WebBootManager : CoreBootManager
    {

        private readonly bool _isForTesting;

        /// <summary>
        /// A bootstrapper for the Merchello plugin which initializes all objects including the Web portion of the plugin
        /// </summary>
        public WebBootManager()
        {
            
        }

        /// <summary>
        /// Constructor for unit tests, ensures some resolvers are not initialized
        /// </summary>
        internal WebBootManager(bool isForTesting = false)
        {
            _isForTesting = isForTesting;
        }

        ///// <summary>
        ///// Initialize objects before anything during the boot cycle happens
        ///// </summary>
        ///// <returns></returns>
        //public override IBootManager Initialize()
        //{
        //    base.Initialize();


        //    return this;
        //}


    }

}