/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Creates content for the `mgit.json` file based on the `package.json` dependencies.
 *
 * @param {Object} packageJson Parsed package.json.
 */
module.exports = function createMgitJsonContent( packageJson ) {
	const mgitJson = {
		dependencies: {}
	};

	const dependencies = Object.assign( {}, packageJson.dependencies, packageJson.devDependencies );

	for ( const dependencyName in dependencies ) {
		const dependencyVersion = dependencies[ dependencyName ];

		if (
			!dependencyName.startsWith( '@ckeditor/ckeditor5' ) &&
			!dependencyVersion.includes( 'cksource/ckeditor' )
		) {
			continue;
		}

		if ( dependencyName.includes( '/ckeditor5-dev' ) ) {
			continue;
		}

		if ( isPathToGitRepoHashVersion( dependencyVersion ) ) {
			mgitJson.dependencies[ dependencyName ] = dependencyVersion;
		} else {
			// Removes '@' from the scoped npm package name.
			mgitJson.dependencies[ dependencyName ] = dependencyName.slice( 1 );
		}
	}

	return mgitJson;
};

function isPathToGitRepoHashVersion( dependency ) {
	return (
		dependency.match( /^(git@github.com:)[\w-]+(\/[\w-]+)?\.git#[0-9a-f]+$/ ) ||
		dependency.match( /^[\w-]+(\/[\w-]+)?#[0-9a-f]+$/ )
	);
}
