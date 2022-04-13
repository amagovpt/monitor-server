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
        PORT: 3000,
        NODE_ENV: "development",
      },
      env_production: {
        NAMESPACE: "AMP",
        AMPID: 0,
        PORT: 3000,
        NODE_ENV: "production",
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
        PORT: 3000,
        NODE_ENV: "development",
      },
      env_production: {
        NAMESPACE: "ADMIN",
        AMSID: 0,
        PORT: 3000,
        NODE_ENV: "production",
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
        PORT: 3000,
        NODE_ENV: "development",
      },
      env_production: {
        NAMESPACE: "USER",
        USRID: 0,
        PORT: 3000,
        NODE_ENV: "production",
      },
    },
  ],
};

