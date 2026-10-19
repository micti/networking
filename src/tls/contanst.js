export const cipherSuites = {
  TLS_AES_128_GCM_SHA256: '1301',
  TLS_CHACHA20_POLY1305_SHA256: '1303',
  TLS_AES_256_GCM_SHA384: '1302',
  TLS_AES_128_CCM_SHA256: '1304',
  TLS_AES_128_CCM_8_SHA256: '1305',
  TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256: 'c02b',
  TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256: 'c02f',
  TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256: 'cca9',
  TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256: 'cca8',
  TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384: 'c02c',
  TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384: 'c030',
  TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA: 'c00a',
  TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA: 'c009',
  TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA: 'c013',
  TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA: 'c014',
  TLS_RSA_WITH_AES_128_GCM_SHA256: '009c',
  TLS_RSA_WITH_AES_256_GCM_SHA384: '009d',
  TLS_RSA_WITH_AES_128_CBC_SHA: '002f',
  TLS_RSA_WITH_AES_256_CBC_SHA: '0035'
}

/**
  00 1d - assigned value for the curve "x25519"
  00 17 - assigned value for the curve "secp256r1"
  00 1e - assigned value for the curve "x448"
  00 19 - assigned value for the curve "secp521r1"
  00 18 - assigned value for the curve "secp384r1"
  01 00 - assigned value for the curve "ffdhe2048"
  01 01 - assigned value for the curve "ffdhe3072"
  01 02 - assigned value for the curve "ffdhe4096"
  01 03 - assigned value for the curve "ffdhe6144"
  01 04 - assigned value for the curve "ffdhe8192"
 */
export const curves = {
  X25519: '001d',
  secp256r1: '0017',
  secp384r1: '0018',
  secp521r1: '0019',
  ffdhe2048: '0100',
  ffdhe3072: '0101'
}

/*
04 03 - assigned value for ECDSA-SECP256r1-SHA256
05 03 - assigned value for ECDSA-SECP384r1-SHA384
06 03 - assigned value for ECDSA-SECP521r1-SHA512
08 07 - assigned value for ED25519
08 08 - assigned value for ED448
08 09 - assigned value for RSA-PSS-PSS-SHA256
08 0a - assigned value for RSA-PSS-PSS-SHA384
08 0b - assigned value for RSA-PSS-PSS-SHA512
08 04 - assigned value for RSA-PSS-RSAE-SHA256
08 05 - assigned value for RSA-PSS-RSAE-SHA384
08 06 - assigned value for RSA-PSS-RSAE-SHA512
04 01 - assigned value for RSA-PKCS1-SHA256
05 01 - assigned value for RSA-PKCS1-SHA384
06 01 - assigned value for RSA-PKCS1-SHA512
*/
export const alos = {
  ecdsa_secp256r1_sha256: '0403',
  ecdsa_secp384r1_sha384: '0503',
  ecdsa_secp521r1_sha512: '0603',
  rsa_pss_rsae_sha256: '0804',
  rsa_pss_rsae_sha384: '0805',
  rsa_pss_rsae_sha512: '0806',
  ed25519: '0807',
  ed448: '0808',
  rsa_pkcs1_sha256: '0401',
  rsa_pkcs1_sha384: '0501',
  rsa_pkcs1_sha512: '0601',
  ecdsa_sha1: '0203',
  rsa_pkcs1_sha1: '0201'
}

export const errors = {
  0: 'close_notify',
  10: 'unexpected_message',
  20: 'bad_record_mac',
  21: 'decryption_failed_RESERVED',
  22: 'record_overflow',
  30: 'decompression_failure_RESERVED',
  40: 'handshake_failure',
  41: 'no_certificate_RESERVED',
  42: 'bad_certificate',
  43: 'unsupported_certificate',
  44: 'certificate_revoked',
  45: 'certificate_expired',
  46: 'certificate_unknown',
  47: 'illegal_parameter',
  48: 'unknown_ca',
  49: 'access_denied',
  50: 'decode_error',
  51: 'decrypt_error',
  60: 'export_restriction_RESERVED',
  70: 'protocol_version',
  71: 'insufficient_security',
  80: 'internal_error',
  86: 'inappropriate_fallback',
  90: 'user_canceled',
  100: 'no_renegotiation_RESERVED',
  109: 'missing_extension',
  110: 'unsupported_extension',
  111: 'certificate_unobtainable_RESERVED',
  112: 'unrecognized_name',
  113: 'bad_certificate_status_response',
  114: 'bad_certificate_hash_value_RESERVED',
  115: 'unknown_psk_identity',
  116: 'certificate_required',
  120: 'no_application_protocol'
}
