module.exports = {
  apps: [
    {
      name: 'surveyor-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/Users/masa/Projects/managed/surveyor',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        CUSTOM_KEY: 'my-value',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
        CUSTOM_KEY: 'my-value',
      },
      // Auto-restart configuration
      autorestart: true,
      watch: false, // Disable watch for dev mode (Next.js handles hot reload)
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Memory and CPU limits
      max_memory_restart: '1G',
      
      // Logging configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Health monitoring
      health_check_interval: 30000,
      health_check_grace_period: 10000,
      
      // Advanced restart conditions
      ignore_watch: ['node_modules', '.next', '.git', 'logs'],
      
      // Instance configuration
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Error handling
      exp_backoff_restart_delay: 100,
      
      // Source map support
      source_map_support: true,
      
      // Process management
      increment_var: 'PORT',
      
      // Additional environment variables
      env_file: '.env.local'
    },
    {
      name: 'surveyor-prod',
      script: 'npm',
      args: 'start',
      cwd: '/Users/masa/Projects/managed/surveyor',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        CUSTOM_KEY: 'my-value',
      },
      
      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Memory and CPU limits
      max_memory_restart: '1G',
      
      // Logging configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Health monitoring
      health_check_interval: 30000,
      health_check_grace_period: 10000,
      
      // Advanced restart conditions
      ignore_watch: ['node_modules', '.next', '.git', 'logs'],
      
      // Instance configuration
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Error handling
      exp_backoff_restart_delay: 100,
      
      // Source map support
      source_map_support: true,
      
      // Process management
      increment_var: 'PORT',
      
      // Additional environment variables
      env_file: '.env.local'
    }
  ],
  
  // Deployment configuration
  deploy: {
    development: {
      user: 'masa',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:username/surveyor.git',
      path: '/Users/masa/Projects/managed/surveyor',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env development',
      'pre-setup': 'npm install -g pm2'
    },
    production: {
      user: 'masa',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:username/surveyor.git',
      path: '/Users/masa/Projects/managed/surveyor',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'npm install -g pm2'
    }
  }
};