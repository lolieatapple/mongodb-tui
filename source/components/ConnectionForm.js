import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

const ConnectionForm = ({ onConnect, defaultUrl = 'mongodb://localhost:27017' }) => {
  const [url, setUrl] = useState(defaultUrl);

  const handleSubmit = () => {
    onConnect(url);
  };

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="green" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="green">🔌 MongoDB Connection</Text>
      </Box>
      <Box>
        <Box marginRight={1}>
          <Text color="yellow" bold>URL:</Text>
        </Box>
        <TextInput 
          value={url} 
          onChange={setUrl} 
          onSubmit={handleSubmit} 
          placeholder="mongodb://localhost:27017"
        />
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Press <Text color="green" bold>Enter</Text> to connect</Text>
      </Box>
    </Box>
  );
};

export default ConnectionForm;
