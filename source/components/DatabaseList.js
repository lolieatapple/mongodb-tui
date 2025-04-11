import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';

const DatabaseList = ({ client, onSelectDatabase, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [databases, setDatabases] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setLoading(true);
        const adminDb = client.db('admin');
        const result = await adminDb.admin().listDatabases();
        const items = result.databases.map(db => ({
          label: db.name,
          value: db.name
        }));
        setDatabases(items);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDatabases();
  }, [client]);

  // Handle ESC key press
  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  if (loading) {
    return (
      <Box>
        <Text>
          <Text color="yellow"><Spinner type="dots" /></Text>
          <Text color="cyan"> Loading databases...</Text>
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="red" padding={1}>
        <Text bold color="red">Error loading databases:</Text>
        <Text color="red">{error}</Text>
        <Box marginTop={1}>
          <Text color="gray">Press <Text color="cyan" bold>ESC</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">📂 Select a Database</Text>
      </Box>
      <SelectInput 
        items={databases} 
        onSelect={item => onSelectDatabase(item.value)}
        itemComponent={({ isSelected, label }) => (
          <Text color={isSelected ? 'green' : 'white'} bold={isSelected}>
            {isSelected ? '● ' : '  '}{label}
          </Text>
        )}
      />
      <Box marginTop={1}>
        <Text color="gray">Use <Text color="cyan" bold>↑↓</Text> to navigate, <Text color="green" bold>Enter</Text> to select</Text>
      </Box>
      <Box>
        <Text color="gray">Press <Text color="cyan" bold>ESC</Text> to go back</Text>
      </Box>
    </Box>
  );
};

export default DatabaseList;
