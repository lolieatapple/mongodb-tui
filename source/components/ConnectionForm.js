import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

const ConnectionForm = ({ onConnect, defaultUrl = 'mongodb://localhost:27017' }) => {
  const [url, setUrl] = useState(defaultUrl);

  const handleSubmit = () => {
    onConnect(url);
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>MongoDB Connection</Text>
      </Box>
      <Box>
        <Box marginRight={1}>
          <Text>URL:</Text>
        </Box>
        <TextInput 
          value={url} 
          onChange={setUrl} 
          onSubmit={handleSubmit} 
          placeholder="mongodb://localhost:27017"
        />
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press Enter to connect</Text>
      </Box>
    </Box>
  );
};

export default ConnectionForm;
