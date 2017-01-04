'use strict';

module.exports = {
  apiHost: 'http://localhost:8080',
  apiPath: '/api/wfm/user',
  authpolicyPath: '/box/srv/1.1/admin/authpolicy',
  policyId: process.env.WFM_AUTH_POLICY_ID || 'wfm',
  defaultAuthResponseExclusionList: ['password'],
  sessionTokenExpiry: 1800
};
