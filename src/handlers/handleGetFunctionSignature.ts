import { McpError, ErrorCode } from '../lib/utils';
import { makeAdtRequest, return_error, return_response, getBaseUrl } from '../lib/utils';
import { normalizeFunctionArgs, resolveFunctionGroup } from './functionResolver';

function extractSignature(fullSource: string): string {
    // Old ABAP style header often uses *"---- separators.
    const oldSyntaxMatch = fullSource.match(/\*"--+[\s\S]*?\*"--+/);
    if (oldSyntaxMatch) {
        return oldSyntaxMatch[0];
    }

    // Fallback: capture function declaration block up to first period.
    const newSyntaxMatch = fullSource.match(/FUNCTION[\s\S]*?\./i);
    if (newSyntaxMatch) {
        return newSyntaxMatch[0];
    }

    return 'Function signature could not be extracted.';
}

export async function handleGetFunctionSignature(args: any) {
    try {
        const { functionName, functionGroup } = normalizeFunctionArgs(args);
        if (!functionName) {
            throw new McpError(ErrorCode.InvalidParams, 'Function name is required');
        }

        const effectiveGroup = functionGroup ?? await resolveFunctionGroup(functionName);
        const encodedFunctionName = encodeURIComponent(functionName);
        const encodedFunctionGroup = encodeURIComponent(effectiveGroup);
        const url = `${await getBaseUrl()}/sap/bc/adt/functions/groups/${encodedFunctionGroup}/fmodules/${encodedFunctionName}/source/main`;
        const response = await makeAdtRequest(url, 'GET', 30000);

        const fullSource = typeof response?.data === 'string'
            ? response.data
            : typeof response === 'string'
                ? response
                : JSON.stringify(response?.data ?? response ?? '');

        const signature = extractSignature(fullSource);
        return return_response({ data: `Function signature for ${functionName}:\n\n${signature}` } as any);
    } catch (error) {
        return return_error(error);
    }
}
