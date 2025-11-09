#!/bin/bash
set -e

echo "🚀 Setting up development environment..."

# Copy SSH keys
echo "🔑 Configuring SSH keys..."
mkdir -p /root/.ssh
cp -p /root/local-ssh/* /root/.ssh/

echo "🔒 Setting SSH key permissions..."
chmod 700 /root/.ssh
find /root/.ssh -type f -exec sh -c 'case "$1" in *.pub) chmod 644 "$1";; *) chmod 600 "$1";; esac' _ {} \;
chown -R root:root /root/.ssh

echo "✅ Development environment ready!"
