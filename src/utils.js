const path = require('path');
const os = require('os');
const fs = require('fs');


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


const writeTempFile = (data, filename) => {
    /*
        Writes data to a temporary file.
        :params:
            data: The data to write to the file.
            filename: The name of the file.
        :returns: The path to the temporary file.
    */
    const tempFilePath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(tempFilePath, data);
    return tempFilePath;
}


const deleteTempFile = (filePath) => {
    /*
        Deletes a temporary file.
        :params:
            filePath: The path to the file to delete.
    */
    fs.unlinkSync(filePath);
}


const readCertificates = () => {
    /*
        Reads the certificates from the environment variables.
        Here, the certificates that we read are in the form of strings concatenated with newlines.
        eg:
            '-----BEGIN CERTIFICATE-----\n'+
            'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA'+
            '-----END CERTIFICATE-----\n'
        As you can see, they look perfect during console log but when read, they are just a bunch of strings
        that are concatenated using + operators.
        So, we write them to a temporary file and then read them. So that the + operators are gone.
        After reading, we delete the temporary file.
    */
    const certificates = {
        'server.key': process.env.SERVER_KEY,
        'server.crt': process.env.SERVER_CRT,
        'client.key': process.env.CLIENT_KEY,
        'client.crt': process.env.CLIENT_CRT,
        'ca.crt': process.env.CA_CRT
    };

    const readCertificates = {};
    for (const [filename, data] of Object.entries(certificates)) {
        const tempFilePath = writeTempFile(data, filename);
        readCertificates[filename] = fs.readFileSync(tempFilePath, 'utf8');
        deleteTempFile(tempFilePath);
    }
    return readCertificates;
}


module.exports = {
    validateSchema,
    readCertificates
};