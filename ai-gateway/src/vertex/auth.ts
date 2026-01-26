import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Scope required for Vertex AI API
const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];

/**
 * Initializes Google Auth to retrieve an OAuth2 access token.
 * It expects 'GOOGLE_SERVICE_ACCOUNT_JSON' in environment variables.
 * This variable can be:
 * 1. A raw JSON string.
 * 2. A file path (relative or absolute) pointing to the JSON file.
 */
export const getAccessToken = async () => {
    try {
        let credentialsInput = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

        if (!credentialsInput) {
            throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON in environment variables.");
        }

        let credentials;

        // Try to parse as JSON first (if it's a raw string)
        try {
            credentials = JSON.parse(credentialsInput);
        } catch (e) {
            // Not a valid JSON string, treat as file path
            const filePath = path.resolve(process.cwd(), credentialsInput);

            if (!fs.existsSync(filePath)) {
                throw new Error(`Credential file not found at: ${filePath}. Check GOOGLE_SERVICE_ACCOUNT_JSON path.`);
            }

            const fileContent = fs.readFileSync(filePath, 'utf-8');
            try {
                credentials = JSON.parse(fileContent);
            } catch (fileParseError) {
                throw new Error(`Failed to parse JSON content from file: ${filePath}`);
            }
        }

        const auth = new GoogleAuth({
            credentials,
            scopes: SCOPES,
        });

        const client = await auth.getClient();
        const accessTokenResponse = await client.getAccessToken();
        const token = accessTokenResponse.token;

        if (!token) {
            throw new Error("Failed to retrieve access token from Google Auth.");
        }

        return {
            token,
            expires: accessTokenResponse.res?.data?.expiry_date, // Expiry timestamp if available
            projectId: await auth.getProjectId(),
        };

    } catch (error: any) {
        console.error("Vertex Auth Error:", error.message);
        throw error; // Re-throw to be handled by the caller/server
    }
};
