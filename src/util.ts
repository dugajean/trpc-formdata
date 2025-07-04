/**
 * Converts a plain object to FormData.
 * Arrays are handled by appending each item with the same key.
 *
 * @param data - The object to convert to FormData
 * @returns A FormData instance containing the object's key-value pairs
 */
function objectToFormData(data: Record<string, any>): FormData {
	const formData = new FormData();
	for (const key in data) {
		const value = data[key];
		if (Array.isArray(value)) {
			for (const item of value) formData.append(key, item);
			continue;
		}
		formData.append(key, value);
	}
	return formData;
}

/**
 * Converts FormData to a plain object.
 * Multiple values with the same key are converted to arrays.
 *
 * @param formData - The FormData instance to convert
 * @returns An object containing the FormData's key-value pairs
 */
function formDataToObject(formData: FormData): Record<string, any> {
	const obj: Record<string, any> = {};
	for (const [key, value] of formData.entries()) {
		if (key in obj) {
			if (Array.isArray(obj[key])) {
				obj[key].push(value);
			} else {
				obj[key] = [obj[key], value];
			}
		} else {
			obj[key] = value;
		}
	}
	return obj;
}
export { objectToFormData, formDataToObject };
