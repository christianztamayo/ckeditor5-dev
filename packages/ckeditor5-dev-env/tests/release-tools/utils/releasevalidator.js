/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-env/release-tools/utils', () => {
	let validator, shExecStub;

	describe( 'validator', () => {
		beforeEach( () => {
			shExecStub = sinon.stub( tools, 'shExec' );

			validator = require( '../../../lib/release-tools/utils/releasevalidator' );
		} );

		afterEach( () => {
			shExecStub.restore();
		} );

		describe( 'checkOptions()', () => {
			it( 'throws an error when token was not found', () => {
				expect( () => {
					validator.checkOptions( {} );
				} ).to.throw( Error, 'GitHub CLI token not found. Use --token=<token>.' );
			} );

			it( 'does not throw when token was not found but package will not be release on GitHub release page', () => {
				expect( () => {
					validator.checkOptions( { skipGithub: true } );
				} ).to.not.throw();
			} );

			it( 'does not throw when options are valid', () => {
				expect( () => {
					validator.checkOptions( { token: 'abc' } );
				} ).to.not.throw();
			} );
		} );

		describe( 'checkBranch()', () => {
			it( 'does not throw if on master and master is clean', () => {
				shExecStub.returns( '## master...origin/master' );

				expect( () => {
					validator.checkBranch();
				} ).to.not.throw();
			} );

			it( 'does not throw an error when master is ahead of origin', () => {
				shExecStub.returns( '## master...origin/master [ahead 1]' );

				expect( () => {
					validator.checkBranch();
				} ).to.not.throw();
			} );

			it( 'throws an error when current branch is not master', () => {
				shExecStub.returns( '## t/2...origin/t/2' );

				expect( () => {
					validator.checkBranch();
				} ).to.throw( Error, 'Current branch is not a "master".' );
			} );

			it( 'throws an error when master is behind origin', () => {
				shExecStub.returns( '## master...origin/master [behind 1]' );

				expect( () => {
					validator.checkBranch();
				} ).to.throw( Error, 'Branch is behind the remote. Pull the changes.' );
			} );

			it( 'throws an error when master contains uncommitted changes', () => {
				shExecStub.returns( '## master...origin/master\n?? x' );

				expect( () => {
					validator.checkBranch();
				} ).to.throw( Error, 'Branch contains uncommitted changes.' );
			} );
		} );
	} );
} );
