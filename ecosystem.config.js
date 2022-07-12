module.exports = {
  apps: [
    {
      name: "monitor-server2",
      namespace: "amp",
      script: "./dist/main.js",
      instances: 2,
      exec_mode: "cluster",
      increment_var: "AMPID",
      env: {
        NAMESPACE: "AMP",
        AMPID: 0,
        PORT: 3001,
        NODE_ENV: "development",
        VALIDATOR: "http://10.55.37.16/validate/",
        REFERER: "http://10.55.37.16/",
      },
      env_production: {
        NAMESPACE: "AMP",
        AMPID: 0,
        PORT: 3001,
        NODE_ENV: "production",
        VALIDATOR: "http://10.55.37.16/validate/",
        REFERER: "http://10.55.37.16/",
      },
    },
    {
      name: "monitor-server2",
      namespace: "admin",
      script: "./dist/main.js",
      instances: 3,
      exec_mode: "cluster",
      increment_var: "AMSID",
      env: {
        NAMESPACE: "ADMIN",
        AMSID: 0,
        PORT: 3001,
        NODE_ENV: "development",
        VALIDATOR: "http://10.55.37.16/validate/",
        REFERER: "http://10.55.37.16/",
      },
      env_production: {
        NAMESPACE: "ADMIN",
        AMSID: 0,
        PORT: 3001,
        NODE_ENV: "production",
        VALIDATOR: "http://10.55.37.16/validate/",
        REFERER: "http://10.55.37.16/",
      },
    },
    {
      name: "monitor-server2",
      namespace: "user",
      script: "./dist/main.js",
      instances: 3,
      exec_mode: "cluster",
      increment_var: "USRID",
      env: {
        NAMESPACE: "USER",
        USRID: 0,
        PORT: 3001,
        NODE_ENV: "development",
        VALIDATOR: "http://10.55.37.16/validate/",
        REFERER: "http://10.55.37.16/",
      },
      env_production: {
        NAMESPACE: "USER",
        USRID: 0,
        PORT: 3001,
        NODE_ENV: "production",
        VALIDATOR: "http://10.55.37.16/validate/",
        REFERER: "http://10.55.37.16/",
      },
    },
  ],
};

