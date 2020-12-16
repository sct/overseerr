import React from 'react';

// We will localize this file when the complete version is released.

const SettingsLogs: React.FC = () => {
  return (
    <>
      <div className="leading-loose text-gray-300 text-sm">
        Logs page is still being built. For now, you can access your logs
        directly in <code>stdout</code> (container logs) or looking in{' '}
        <code>/app/config/logs/overseerr.logs</code>
      </div>
    </>
  );
};

export default SettingsLogs;
