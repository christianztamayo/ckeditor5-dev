/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const minimist = require( 'minimist' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * @param {Array.<String>} args
 * @returns {Object}
 */
module.exports = function parseArguments( args ) {
	const log = logger();

	const minimistConfig = {
		string: [
			'browsers',
			'files',
			'reporter',
			'debug',
			'karma-config-overrides',
			'repositories',
			'language',
			'theme-path',
			'additional-languages',
			'coverage-paths'
		],

		boolean: [
			'coverage',
			'production',
			'server',
			'source-map',
			'verbose',
			'watch',
			'silent'
		],

		alias: {
			b: 'browsers',
			c: 'coverage',
			d: 'debug',
			f: 'files',
			i: 'identity-file',
			r: 'repositories',
			s: 'source-map',
			v: 'verbose',
			w: 'watch'
		},

		default: {
			files: [],
			browsers: 'Chrome',
			reporter: 'mocha',
			language: 'en',
			watch: false,
			coverage: false,
			'coverage-paths': '',
			verbose: false,
			'source-map': false,
			server: false,
			production: false,
			'identity-file': null,
			repositories: [],
			'theme-path': null,
			'additional-languages': null,
			silent: false
		}
	};

	const options = minimist( args, minimistConfig );

	// Delete all aliases because we don't want to use them in the code.
	// They are useful when calling a command but useless after that.
	for ( const alias of Object.keys( minimistConfig.alias ) ) {
		delete options[ alias ];
	}

	replaceKebabCaseWithCamelCase( options, [
		'source-map',
		'identity-file',
		'theme-path',
		'karma-config-overrides',
		'additional-languages',
		'coverage-paths'
	] );
	splitOptionsToArray( options, [
		'browsers',
		'files',
		'repositories',
		'additionalLanguages',
		'coveragePaths'
	] );
	parseDebugOption( options );
	parseRepositoriesOption( options );

	return options;

	/**
	 * Replaces all kebab-case keys in the `options` object with camelCase entries.
	 * Kebab-case keys will be removed.
	 *
	 * @param {Object} options
	 * @param {Array.<String>} keys Kebab-case keys in `options` object.
	 */
	function replaceKebabCaseWithCamelCase( options, keys ) {
		for ( const key of keys ) {
			const camelCaseKey = toCamelCase( key );

			options[ camelCaseKey ] = options[ key ];
			delete options[ key ];
		}
	}

	/**
	 * Parses the `--debug` option.
	 *
	 * @param {Object} options
	 */
	function parseDebugOption( options ) {
		if ( options.debug === 'false' || options.debug === false ) {
			options.debug = [];
		} else if ( typeof options.debug === 'string' ) {
			options.debug = [
				'CK_DEBUG',
				...options.debug.split( ',' ).map( flag => 'CK_DEBUG_' + flag.toUpperCase() )
			];
		} else {
			options.debug = [ 'CK_DEBUG' ];
		}
	}

	/**
	 * Parses the `--repositories` option if specified.
	 *
	 * All packages found in the `packages/` directory inside the root repository or the `external/[repository-name]/packages/` directory
	 * will be added as `options.files`.
	 *
	 * The `ckeditor5-` prefix will be removed.
	 *
	 * @param {Object} options
	 */
	function parseRepositoriesOption( options ) {
		if ( !options.repositories.length ) {
			return;
		}

		const cwd = process.cwd();
		const shouldCheckExternalDirectory = tools.isDirectory( path.join( cwd, 'external' ) );

		if ( !shouldCheckExternalDirectory ) {
			log.warning( 'The `external/` directory does not exist. Only the root repository will be checked.' );
		}

		const files = new Set( options.files );

		for ( const repositoryName of options.repositories ) {
			// Check the main repository.
			if ( repositoryName === tools.readPackageName( cwd ) ) {
				addPackagesToCollection( files, path.join( cwd, 'packages' ) );

				continue;
			}

			// If the `external/` directory does not exist, do not check anything.
			if ( !shouldCheckExternalDirectory ) {
				continue;
			}

			const externalRepositoryPath = path.join( cwd, 'external', repositoryName );

			// Check the "external" directory.
			if ( tools.isDirectory( externalRepositoryPath ) ) {
				addPackagesToCollection( files, path.join( externalRepositoryPath, 'packages' ) );
			} else {
				log.warning( `Did not find the repository "${ repositoryName }" in the root repository or the "external/" directory.` );
			}
		}

		options.files = [ ...files ];

		function addPackagesToCollection( collection, directoryPath ) {
			for ( const directory of tools.getDirectories( directoryPath ) ) {
				collection.add( directory.replace( /^ckeditor5?-/, '' ) );
			}
		}
	}

	/**
	 * Splits by a comma (`,`) all values specified under keys to array.
	 *
	 * @param {Object} options
	 * @param {Array.<String>} keys Kebab-case keys in `options` object.
	 */
	function splitOptionsToArray( options, keys ) {
		for ( const key of keys ) {
			if ( typeof options[ key ] === 'string' ) {
				options[ key ] = options[ key ].split( ',' );
			}
		}
	}

	/**
	 * Returns a camel case value for specified kebab-case `value`.
	 *
	 * @param {String} value Kebab-case string.
	 * @returns {String}
	 */
	function toCamelCase( value ) {
		return value.split( '-' )
			.map( ( item, index ) => {
				if ( index == 0 ) {
					return item.toLowerCase();
				}

				return item.charAt( 0 ).toUpperCase() + item.slice( 1 ).toLowerCase();
			} )
			.join( '' );
	}
};
