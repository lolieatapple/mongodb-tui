#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
		Usage
		  $ mongodb-tui [options]

		Options
			--url  MongoDB connection URL (default: mongodb://localhost:27017)

		Examples
		  $ mongodb-tui
		  $ mongodb-tui --url=mongodb://username:password@localhost:27017
	`,
	{
		importMeta: import.meta,
		flags: {
			url: {
				type: 'string',
				default: 'mongodb://localhost:27017'
			}
		}
	},
);

render(<App />);
