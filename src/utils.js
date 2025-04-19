const validateSchema = (expectedSchema, dataObject) => {
    /*
        Validates object against the expected schema.
        :params:
            expectedSchema: The expected schema of the object.
            dataObject: The object whose schema is getting checked.
        :returns: true if valid, false if not.
    */
    return Object.entries(expectedSchema).every(([key, expectedType]) => {
        return key in dataObject && typeof dataObject[key] === expectedType;
    });
}


module.exports = {
    validateSchema
};