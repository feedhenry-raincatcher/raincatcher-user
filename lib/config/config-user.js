'use strict';

module.exports = {
  apiHost: 'http://localhost:8080',
  apiPath: '/api/wfm/user',
  authpolicyPath: '/box/srv/1.1/admin/authpolicy',
  policyId: process.env.WFM_AUTH_POLICY_ID || 'wfm',
  defaultProfileDataExclusionList: ['password'],
  sessionTokenExpiry: process.env.WFM_TOKEN_EXPIRY || 1800,
  requestTimeout: process.env.WFM_REQUEST_TIMEOUT || 25000,
  clientRequestTimeout: process.env.WFM_CLIENT_REQUEST_TIMEOUT || 25000
};
