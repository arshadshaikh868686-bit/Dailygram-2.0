const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const getKey = () => {
    return crypto
        .createHash('sha256')
        .update(process.env.MESSAGE_ENCRYPTION_KEY)
        .digest();
};

const encryptMessage = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return [
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex')
    ].join(':');
};

const decryptMessage = (encryptedText) => {
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        getKey(),
        Buffer.from(ivHex, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, 'hex')),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
};

module.exports = {
    encryptMessage,
    decryptMessage
};