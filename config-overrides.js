
/* module.exports = function override(config, env) {
  console.log('config', config);
  config.resolve = {
      ...config.resolve,
      fallback: {
         "http": require.resolve("stream-http"),
         "crypto": require.resolve("crypto-browserify"),
         "crypto": false,
         "stream-http": false,
         "http": false,
         "buffer": false,
         "https": false,
         "util":  false,
         "stream":  false, 
         
       },
  }

  return config;
}
 */
 module.exports = {
  // ...
  resolve: {
    fallback: {
     // "http": require.resolve("stream-http"),
      //"crypto": require.resolve("crypto-browserify"),
      "crypto": false,
      "stream-http": false,
      "http": false,
      
    },
  },
}; 