/**
 * customerOperations.ts
 *
 * Supabase CRUD operations for the customers table.
 * Handles sync between local SQLite and cloud Supabase for customer records.
 *
 * Used by: db/supabase/sync/customerSync.ts, hooks/useCustomerSync.ts
 *
 * Supabase table: customers
 */

import { supabase } from '../supabase';
import type {
	SupabaseCustomer,
	SupabaseCustomerInsert,
} from '../types';

/**
 * Uploads a new customer to Supabase or updates if already exists.
 * Uses upsert to handle both insert and update scenarios.
 *
 * @param customer - The customer data to upload
 * @returns The created/updated customer record
 * @throws Error if the operation fails
 */
export async function uploadCustomer(customer: SupabaseCustomerInsert): Promise<SupabaseCustomer> {
	const { data, error } = await supabase
		.from('customers')
		.upsert(customer, { onConflict: 'id' })
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to upload customer: ${error.message}`);
	}

	return data as SupabaseCustomer;
}

/**
 * Uploads multiple customers to Supabase in a batch operation.
 * Uses upsert to handle both insert and update scenarios.
 *
 * @param customers - Array of customer data to upload
 * @returns Array of created/updated customer records
 * @throws Error if the operation fails
 */
export async function uploadCustomers(customers: SupabaseCustomerInsert[]): Promise<SupabaseCustomer[]> {
	if (customers.length === 0) {
		return [];
	}

	const { data, error } = await supabase
		.from('customers')
		.upsert(customers, { onConflict: 'id' })
		.select();

	if (error) {
		throw new Error(`Failed to upload customers: ${error.message}`);
	}

	return (data ?? []) as SupabaseCustomer[];
}

/**
 * Retrieves all customers associated with a specific user.
 *
 * @param userId - The Supabase UUID of the user
 * @returns Array of customer records belonging to the user
 * @throws Error if the operation fails
 */
export async function getCustomersByUser(userId: string): Promise<SupabaseCustomer[]> {
	const { data, error } = await supabase
		.from('customers')
		.select('*')
		.eq('userId', userId);

	if (error) {
		throw new Error(`Failed to get customers by user: ${error.message}`);
	}

	return (data ?? []) as SupabaseCustomer[];
}

/**
 * Deletes a customer from Supabase by their UUID.
 *
 * @param id - The Supabase UUID of the customer to delete
 * @throws Error if the operation fails
 */
export async function deleteCustomer(id: string): Promise<void> {
	const { error } = await supabase.from('customers').delete().eq('id', id);

	if (error) {
		throw new Error(`Failed to delete customer: ${error.message}`);
	}
}
