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
