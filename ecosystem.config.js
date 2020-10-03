module.exports = {
  apps : [/*{
    name: 'monitor-server',
    script: './dist/main.js',
    instances  : -2,
    exec_mode  : 'cluster',
    increment_var : 'ID',
    env: {
      ID: 0,
      PORT: 3000,
      NODE_ENV: 'development',
    },
    env_production: {
      ID: 0,
      PORT: 3000,
      NODE_ENV: 'production',
    }
  },*/
  {
    name: 'monitor-server',
    namespace: 'amp',
    script: './dist/main.js',
    instances  : 'max',
    exec_mode  : 'cluster',
    increment_var : 'ID2',
    env: {
      ID2: 0,
      NAMESPACE: 'AMP',
      PORT: 3001,
      NODE_ENV: 'development',
    },
    env_production: {
      ID2: 0,
      NAMESPACE: 'AMP',
      PORT: 3001,
      NODE_ENV: 'production',
    }
  }]
}