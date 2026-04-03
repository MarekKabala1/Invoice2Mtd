/**
 * userOperations.ts
 *
 * Supabase CRUD operations for the users table.
 * Handles sync between local SQLite and cloud Supabase for user records.
 *
 * Used by: db/supabase/sync/userSync.ts, hooks/useUserSync.ts
 *
 * Supabase table: users
 */

import { supabase } from '../supabase';
import type {
	SupabaseUser,
	SupabaseUserInsert,
	SupabaseUserUpdate,
} from '../types';

/**
 * Uploads a new user to Supabase or updates if already exists.
 * Uses upsert to handle both insert and update scenarios.
 *
 * @param user - The user data to upload
 * @returns The created/updated user record
 * @throws Error if the operation fails
 */
export async function uploadUser(user: SupabaseUserInsert): Promise<SupabaseUser> {
	const { data, error } = await supabase
		.from('users')
		.upsert(user, { onConflict: 'id' })
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to upload user: ${error.message}`);
	}

	return data as SupabaseUser;
}

/**
 * Updates an existing user record in Supabase.
 *
 * @param user - The user data to update (partial update supported)
 * @returns The updated user record
 * @throws Error if the operation fails or user not found
 */
export async function updateUser(user: SupabaseUserUpdate): Promise<SupabaseUser> {
	if (!user.id) {
		throw new Error('User ID is required for update');
	}

	const { data, error } = await supabase
		.from('users')
		.update(user)
		.eq('id', user.id)
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to update user: ${error.message}`);
	}

	if (!data) {
		throw new Error('User not found');
	}

	return data as SupabaseUser;
}

/**
 * Retrieves a user by their Supabase UUID.
 *
 * @param id - The Supabase UUID of the user
 * @returns The user record or null if not found
 * @throws Error if the operation fails
 */
export async function getUserById(id: string): Promise<SupabaseUser | null> {
	const { data, error } = await supabase
		.from('users')
		.select('*')
		.eq('id', id)
		.maybeSingle();

	if (error) {
		throw new Error(`Failed to get user by ID: ${error.message}`);
	}

	return data as SupabaseUser | null;
}

/**
 * Retrieves a user by their local SQLite ID.
 *
 * @param localId - The local SQLite ID of the user
 * @returns The user record or null if not found
 * @throws Error if the operation fails
 */
export async function getUserByLocalId(localId: string): Promise<SupabaseUser | null> {
	const { data, error } = await supabase
		.from('users')
		.select('*')
		.eq('localId', localId)
		.maybeSingle();

	if (error) {
		throw new Error(`Failed to get user by local ID: ${error.message}`);
	}

	return data as SupabaseUser | null;
}

/**
 * Deletes a user from Supabase by their UUID.
 *
 * @param id - The Supabase UUID of the user to delete
 * @throws Error if the operation fails
 */
export async function deleteUser(id: string): Promise<void> {
	const { error } = await supabase.from('users').delete().eq('id', id);

	if (error) {
		throw new Error(`Failed to delete user: ${error.message}`);
	}
}
