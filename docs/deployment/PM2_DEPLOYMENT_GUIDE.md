# PM2 Deployment Guide for Surveyor

## Overview

This guide provides comprehensive instructions for managing the Surveyor application using PM2 for stable, persistent local deployment. PM2 ensures the application remains running even after terminal sessions end and provides robust process management capabilities.

## Prerequisites

- Node.js installed
- PM2 installed globally (`npm install -g pm2`)
- Surveyor project dependencies installed (`npm install`)

## Quick Start

### Starting the Application

```bash
# Development mode (recommended for local development)
./pm2-scripts/start-dev.sh

# Production mode (for production-like local deployment)
./pm2-scripts/start-prod.sh
```

### Accessing the Application

Once started, the application will be available at:
- **URL**: http://localhost:3002
- **Environment**: Development or Production (depending on how it was started)

## PM2 Management Scripts

### 1. Start Development Server
```bash
./pm2-scripts/start-dev.sh
```
- Starts the Next.js development server with hot reloading
- Runs on port 3002 by default
- Automatically restarts on crashes
- Provides development-optimized logging

### 2. Start Production Server
```bash
./pm2-scripts/start-prod.sh
```
- Builds the application for production
- Starts the production server in cluster mode
- Optimized for performance and stability
- Multiple instances for load balancing

### 3. Restart Application
```bash
./pm2-scripts/restart.sh
```
- Performs zero-downtime restart
- Automatically detects running processes
- Maintains application availability during restart

### 4. Stop Application
```bash
./pm2-scripts/stop.sh
```
- Stops all surveyor processes
- Cleans up PM2 process list
- Graceful shutdown with proper cleanup

### 5. View Logs
```bash
./pm2-scripts/logs.sh                 # View recent logs
./pm2-scripts/logs.sh --follow        # Follow logs in real-time
./pm2-scripts/logs.sh --errors        # Show only error logs
./pm2-scripts/logs.sh --lines 100     # Show last 100 lines
./pm2-scripts/logs.sh --clear         # Clear all logs
```

### 6. Monitor Application
```bash
./pm2-scripts/monitor.sh              # Show basic status
./pm2-scripts/monitor.sh --monit      # Open PM2 monitoring interface
./pm2-scripts/monitor.sh --info       # Show detailed process info
./pm2-scripts/monitor.sh --health     # Check application health
```

## Direct PM2 Commands

### Basic Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs surveyor-dev

# Restart specific process
pm2 restart surveyor-dev

# Stop specific process
pm2 stop surveyor-dev

# Delete process
pm2 delete surveyor-dev

# Monitor in real-time
pm2 monit
```

### Advanced Commands
```bash
# Show detailed process information
pm2 show surveyor-dev

# Flush all logs
pm2 flush

# Reset restart counter
pm2 reset surveyor-dev

# Show memory usage
pm2 show surveyor-dev --memory

# Scale application (production mode only)
pm2 scale surveyor-prod +2
```

## Configuration

### Ecosystem Configuration
The application uses `ecosystem.config.js` for PM2 configuration:

```javascript
module.exports = {
  apps: [
    {
      name: 'surveyor-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/Users/masa/Projects/managed/surveyor',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      // Auto-restart and monitoring settings
      autorestart: true,
      max_memory_restart: '1G',
      health_check_interval: 30000,
      // Logging configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log'
    }
  ]
}
```

### Environment Variables
- `NODE_ENV`: Set to 'development' or 'production'
- `PORT`: Application port (default: 3002)
- `CUSTOM_KEY`: Application-specific configuration

### Log Management
- **Combined logs**: `logs/combined.log`
- **Output logs**: `logs/out.log`
- **Error logs**: `logs/error.log`
- **Log rotation**: Automatic with PM2
- **Log format**: Timestamped entries

## Health Monitoring

### Automatic Health Checks
- **Health check interval**: 30 seconds
- **Grace period**: 10 seconds
- **Max restarts**: 10 attempts
- **Restart delay**: 4 seconds

### Manual Health Checks
```bash
# Check if application is accessible
curl -I http://localhost:3002

# Check process status
pm2 show surveyor-dev

# Monitor resource usage
pm2 monit
```

## Troubleshooting

### Common Issues

1. **Application not starting**
   ```bash
   # Check logs for errors
   pm2 logs surveyor-dev --lines 50
   
   # Ensure dependencies are installed
   npm install
   
   # Check if port is available
   lsof -i :3002
   ```

2. **Application crashing**
   ```bash
   # Check error logs
   pm2 logs surveyor-dev --err
   
   # Reset and restart
   pm2 reset surveyor-dev
   pm2 restart surveyor-dev
   ```

3. **Port conflicts**
   ```bash
   # Check what's using the port
   lsof -i :3002
   
   # Kill conflicting process
   kill -9 <PID>
   ```

4. **Memory issues**
   ```bash
   # Check memory usage
   pm2 show surveyor-dev
   
   # Restart if memory limit exceeded
   pm2 restart surveyor-dev
   ```

### Log Analysis
```bash
# View application startup logs
pm2 logs surveyor-dev --lines 100 | grep "Ready"

# Monitor for errors
pm2 logs surveyor-dev --err --lines 20

# Check restart patterns
pm2 show surveyor-dev | grep restart
```

## Best Practices

### Development
- Use `./pm2-scripts/start-dev.sh` for local development
- Monitor logs regularly with `./pm2-scripts/logs.sh --follow`
- Use `./pm2-scripts/restart.sh` after code changes that require restart

### Production
- Use `./pm2-scripts/start-prod.sh` for production deployment
- Monitor application health with `./pm2-scripts/monitor.sh --health`
- Set up log rotation and monitoring alerts

### Maintenance
- Regularly clear logs with `./pm2-scripts/logs.sh --clear`
- Monitor memory usage and restart if necessary
- Keep PM2 updated: `npm install -g pm2@latest`

## Integration with Development Workflow

### Code Changes
1. Make your code changes
2. For development: Hot reloading handles most changes automatically
3. For server-side changes: Use `./pm2-scripts/restart.sh`
4. For dependency changes: Stop, install, and restart

### Testing
```bash
# Run tests while application is running
npm test

# Check application health after changes
./pm2-scripts/monitor.sh --health
```

### Deployment
```bash
# Build and start production version
./pm2-scripts/start-prod.sh

# Verify deployment
curl -I http://localhost:3002
./pm2-scripts/monitor.sh --health
```

## Startup on Boot

To automatically start the application on system boot:

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save

# The application will now start automatically on boot
```

## Performance Optimization

### Memory Management
- Monitor memory usage with `pm2 monit`
- Set appropriate memory limits in ecosystem config
- Use cluster mode for production to utilize all CPU cores

### Log Management
- Rotate logs regularly to prevent disk space issues
- Use appropriate log levels for different environments
- Consider external log aggregation for production

## Security Considerations

- Run application with appropriate user permissions
- Monitor for suspicious activity in logs
- Keep dependencies updated
- Use environment variables for sensitive configuration

## Support and Maintenance

### Regular Tasks
- Monitor application health daily
- Review logs weekly
- Update dependencies monthly
- Performance review quarterly

### Emergency Procedures
```bash
# Quick restart for immediate issues
pm2 restart surveyor-dev

# Full reset for persistent problems
pm2 kill
./pm2-scripts/start-dev.sh

# Emergency stop
pm2 stop all
```

This guide provides comprehensive coverage of PM2 deployment and management for the Surveyor application. For additional support or custom configurations, refer to the PM2 documentation or contact the development team.