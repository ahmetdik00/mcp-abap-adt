import { McpError, ErrorCode, AxiosResponse } from '../lib/utils';
import { makeAdtRequest, return_error, return_response, getBaseUrl } from '../lib/utils';
import { normalizeFunctionArgs, resolveFunctionGroup } from './functionResolver';

export async function handleGetFunction(args: any) {
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
        return return_response(response);
    } catch (error) {
        return return_error(error);
    }
}
