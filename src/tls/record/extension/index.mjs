import alpn from './alpn.mjs'
import delegatedCredentials from './delegated_credentials.mjs'
import ecPoints from './ec_points.mjs'
import encryptMac from './encrypt_mac.mjs'
import extendMasterSecret from './extend_master_secret.mjs'
import keyShare from './key_share.mjs'
import padding from './padding.mjs'
import recordSizeLimit from './record_size_limit.mjs'
import renegotiationInfo from './renegotiation_info.mjs'
import serverName from './server_name.mjs'
import sessionTicket from './session_ticket.mjs'
import signatureAlgorithms from './signature_algorithms.mjs'
import supportedGroups from './supported_groups.mjs'
import supportedVersions from './supported_versions.mjs'
import statusRequest from './status_request.mjs'
import pskKeyExchangeModes from './psk_key_exchange_modes.mjs'

export const build = {
  alpn: alpn.build,
  delegated_credentials: delegatedCredentials.build,
  ec_points: ecPoints.build,
  encrypt_mac: encryptMac.build,
  extend_master_secret: extendMasterSecret.build,
  key_share: keyShare.build,
  padding: padding.build,
  record_size_limit: recordSizeLimit.build,
  renegotiation_info: renegotiationInfo.build,
  server_name: serverName.build,
  session_ticket: sessionTicket.build,
  signature_algorithms: signatureAlgorithms.build,
  psk_key_exchange_modes: pskKeyExchangeModes.build,
  supported_groups: supportedGroups.build,
  supported_versions: supportedVersions.build,
  status_request: statusRequest.build
}

export const parse = {
  // alpn: alpn.build,
  // delegated_credentials: delegated_credentials.build,
  // ec_points: ec_points.build,
  // encrypt_mac: encrypt_mac.build,
  // extend_master_secret: extend_master_secret.build,
  key_share: keyShare.parse,
  // padding: padding.build,
  // record_size_limit: record_size_limit.build,
  // renegotiation_info: renegotiation_info.build,
  // server_name: server_name.build,
  // session_ticket: session_ticket.build,
  // signature_algorithms: signature_algorithms.build,
  // psk_key_exchange_modes: psk_key_exchange_modes.build,
  // supported_groups: supported_groups.build,
  supported_versions: supportedVersions.parse
  // status_request: status_request.build
}

export const type = {
  ALPN: alpn.TYPE,
  DELEGATED_CREDENTIALS: delegatedCredentials.TYPE,
  EC_POINTS: ecPoints.TYPE,
  ENCRYPT_MAC: encryptMac.TYPE,
  EXTEND_MASTER_SECRET: extendMasterSecret.TYPE,
  KEY_SHARE: keyShare.TYPE,
  PADDING: padding.TYPE,
  RECORD_SIZE_LIMIT: recordSizeLimit.TYPE,
  RENEGOTIATION_INFO: renegotiationInfo.TYPE,
  SERVER_NAME: serverName.TYPE,
  SESSION_TICKET: sessionTicket.TYPE,
  SIGNATURE_ALGORITHMS: signatureAlgorithms.TYPE,
  PSK_KEY_EXCHANGE_MODES: pskKeyExchangeModes.TYPE,
  SUPPORTED_GROUPS: supportedGroups.TYPE,
  SUPPORTED_VERSIONS: supportedVersions.TYPE,
  STATUS_REQUEST: statusRequest.TYPE
}
