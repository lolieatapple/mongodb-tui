import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';

const CollectionList = ({ db, onSelectCollection, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const collectionList = await db.listCollections().toArray();
        const items = collectionList.map(collection => ({
          label: collection.name,
          value: collection.name
        }));
        setCollections(items);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [db]);

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
          <Text color="magenta"><Spinner type="dots" /></Text>
          <Text color="cyan"> Loading collections...</Text>
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="red" padding={1}>
        <Text bold color="red">Error loading collections:</Text>
        <Text color="red">{error}</Text>
        <Box marginTop={1}>
          <Text color="gray">Press <Text color="cyan" bold>ESC</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  if (collections.length === 0) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="yellow" padding={1}>
        <Text color="yellow" bold>No collections found in this database.</Text>
        <Box marginTop={1}>
          <Text color="gray">Press <Text color="cyan" bold>ESC</Text> to go back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="magenta" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="magenta">📁 Select a Collection</Text>
      </Box>
      <SelectInput 
        items={collections} 
        onSelect={item => onSelectCollection(item.value)}
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

export default CollectionList;
