import { makeAdtRequest, getBaseUrl } from '../lib/utils';

function normalizeName(value: string): string {
    return value.trim().toUpperCase();
}

function extractFunctionUris(payload: string): Array<{ group: string; name: string }> {
    // Typical ADT quick search payload includes URIs like:
    // /sap/bc/adt/functions/groups/<FG>/fmodules/<FM>
    const matches = payload.matchAll(/\/functions\/groups\/([^\/\"'<\s?]+)\/fmodules\/([^\/\"'<\s?]+)/g);
    const result: Array<{ group: string; name: string }> = [];

    for (const match of matches) {
        const group = decodeURIComponent(match[1] ?? '').trim();
        const name = decodeURIComponent(match[2] ?? '').trim();
        if (!group || !name) continue;
        result.push({ group, name });
    }

    return result;
}

export async function resolveFunctionGroup(functionNameRaw: string): Promise<string> {
    const functionName = normalizeName(functionNameRaw);
    const query = encodeURIComponent(functionName);
    const maxResults = 100;
    const url = `${await getBaseUrl()}/sap/bc/adt/repository/informationsystem/search?operation=quickSearch&query=${query}&maxResults=${maxResults}`;
    const response = await makeAdtRequest(url, 'GET', 30000);

    const payload = typeof response?.data === 'string'
        ? response.data
        : typeof response === 'string'
            ? response
            : JSON.stringify(response?.data ?? response ?? '');

    const candidates = extractFunctionUris(payload);
    const exact = candidates.find((item) => normalizeName(item.name) === functionName);
    if (exact) {
        return exact.group.toUpperCase();
    }

    if (candidates.length > 0) {
        return candidates[0].group.toUpperCase();
    }

    throw new Error(`Function group could not be resolved for ${functionName}`);
}

export function normalizeFunctionArgs(args: any): { functionName: string; functionGroup: string | null } {
    const functionName = args?.function_name ? normalizeName(String(args.function_name)) : '';
    const functionGroup = args?.function_group ? normalizeName(String(args.function_group)) : null;
    return { functionName, functionGroup };
}
