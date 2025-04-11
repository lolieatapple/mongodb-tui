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
          <Spinner type="dots" />
          {' Loading collections...'}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error loading collections:</Text>
        <Text color="red">{error}</Text>
        <Box marginTop={1}>
          <Text dimColor>Press ESC to go back</Text>
        </Box>
      </Box>
    );
  }

  if (collections.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>No collections found in this database.</Text>
        <Box marginTop={1}>
          <Text dimColor>Press ESC to go back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Select a Collection</Text>
      </Box>
      <SelectInput 
        items={collections} 
        onSelect={item => onSelectCollection(item.value)} 
      />
      <Box marginTop={1}>
        <Text dimColor>Use arrow keys to navigate, Enter to select</Text>
      </Box>
      <Box>
        <Text dimColor>Press ESC to go back</Text>
      </Box>
    </Box>
  );
};

export default CollectionList;
