import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { MongoClient } from 'mongodb';

import ConnectionForm from './components/ConnectionForm.js';
import DatabaseList from './components/DatabaseList.js';
import CollectionList from './components/CollectionList.js';
import DocumentViewer from './components/DocumentViewer.js';

export default function App() {
	const [client, setClient] = useState(null);
	const [connected, setConnected] = useState(false);
	const [error, setError] = useState(null);
	const [currentDb, setCurrentDb] = useState(null);
	const [currentCollection, setCurrentCollection] = useState(null);
	const [view, setView] = useState('connection'); // connection, databases, collections, documents

	const handleConnect = async (url) => {
		try {
			const newClient = new MongoClient(url);
			await newClient.connect();
			setClient(newClient);
			setConnected(true);
			setView('databases');
			setError(null);
		} catch (err) {
			setError(`Connection error: ${err.message}`);
		}
	};

	const handleSelectDatabase = (dbName) => {
		setCurrentDb(client.db(dbName));
		setView('collections');
	};

	const handleSelectCollection = (collectionName) => {
		setCurrentCollection(currentDb.collection(collectionName));
		setView('documents');
	};

	const handleBack = () => {
		if (view === 'documents') {
			setView('collections');
			setCurrentCollection(null);
		} else if (view === 'collections') {
			setView('databases');
			setCurrentDb(null);
		} else if (view === 'databases') {
			setView('connection');
			setConnected(false);
			if (client) {
				client.close().catch(console.error);
				setClient(null);
			}
		}
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text bold backgroundColor="blue" color="white" padding={1}>
					MongoDB TUI
				</Text>
			</Box>

			{error && (
				<Box marginBottom={1}>
					<Text color="red">{error}</Text>
				</Box>
			)}

			{view === 'connection' && (
				<ConnectionForm onConnect={handleConnect} />
			)}

			{view === 'databases' && connected && (
				<DatabaseList 
					client={client} 
					onSelectDatabase={handleSelectDatabase} 
					onBack={handleBack}
				/>
			)}

			{view === 'collections' && currentDb && (
				<CollectionList 
					db={currentDb} 
					onSelectCollection={handleSelectCollection} 
					onBack={handleBack}
				/>
			)}

			{view === 'documents' && currentCollection && (
				<DocumentViewer collection={currentCollection} onBack={handleBack} />
			)}

			{view !== 'connection' && (
				<Box marginTop={1}>
					<Text dimColor>Press ESC to go back</Text>
				</Box>
			)}
		</Box>
	);
}
