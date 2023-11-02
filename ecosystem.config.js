module.exports = {
  apps: [
    {
      name: "monitor-server",
      namespace: "amp",
      script: "./dist/main.js",
      instances: 2,
      exec_mode: "cluster",
      increment_var: "AMPID",
      env: {
        NAMESPACE: "AMP",
        AMPID: 0,
      }
    },
    {
      name: "monitor-server",
      namespace: "admin",
      script: "./dist/main.js",
      instances: 3,
      exec_mode: "cluster",
      increment_var: "AMSID",
      env: {
        NAMESPACE: "ADMIN",
        AMSID: 0,}
    },
    {
      name: "monitor-server",
      namespace: "user",
      script: "./dist/main.js",
      instances: 3,
      exec_mode: "cluster",
      increment_var: "USRID",
      env: {
        NAMESPACE: "USER",
        USRID: 0,}
    },
  ],
};

