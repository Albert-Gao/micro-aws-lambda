import { APIGatewayEvent, Context } from 'aws-lambda';

export const getMockEvent = (): APIGatewayEvent => ({
  resource: '/company',
  path: '/company',
  httpMethod: 'POST',
  headers: {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate',
    Authorization:
      'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik1FVTRNak5CUlRoRE56STJPVEZHUWpWRU5ESXhRekk1TVRWRU1EaERPRU0xTTBVMFJURkVNZyJ9.eyJodHRwczovL3RlYW1pbmcuY2xvdWQvand0L2NsYWltcyI6eyJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJ1c2VyIiwieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJ1c2VyIl0sIngtaGFzdXJhLXVzZXItaWQiOiJhdXRoMHw1ZDE5ZTY1NDhjZGE4NjBjY2M2NTIzYzIifSwiaXNzIjoiaHR0cHM6Ly90ZWFtaW5nLWNsb3VkLWRldi5hdS5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NWQxOWU2NTQ4Y2RhODYwY2NjNjUyM2MyIiwiYXVkIjoiU3Y0OG81NVcxTXN6RmdBdEM1M1gzTEF3V2xZamh0OVYiLCJpYXQiOjE1NjI0NjY1NjksImV4cCI6MTU2MjUwMjU2OSwiYXRfaGFzaCI6ImlkOWh1di1VbHFabTBDX19VcU1qWWciLCJub25jZSI6IlhxbVEwcTgueWx5eHpIZmdtSkEyczhwUlBZU2REaTVIIn0.4r-Cl_8kJzP49UQNWEMEf7692SdIlWn0KRtVisZIoqJzkv5nlIiYKbNdClgjC6_7wPSMDiG-K7hfn5vrR4N4h58RL96GkyZKObp7TOZWHGYWqv6j6_oMkLoU_1v_GkY4oDB8w92yXl74MxmXd8y7aV3I1415wyWSFJaYPJaBhF0hCWjU0iGNK_vmw3NhzIo-yhHV9P5JcB2x5B5nUbW_GcqObWAQ1KkWJ_juaPcYJguYLzrjoSA33851iWTIiDUPK_dXDzA_i99xyMySm15gWdI3HSHM6-UOdfo3xgIfSrnNL47ta5eh0hP4Yahi2eza9bIurW3dBhJnpMJ9_f35Kg',
    'Cache-Control': 'no-cache',
    'CloudFront-Forwarded-Proto': 'https',
    'CloudFront-Is-Desktop-Viewer': 'true',
    'CloudFront-Is-Mobile-Viewer': 'false',
    'CloudFront-Is-SmartTV-Viewer': 'false',
    'CloudFront-Is-Tablet-Viewer': 'false',
    'CloudFront-Viewer-Country': 'NZ',
    Host: 'nkh2w77kh9.execute-api.us-east-1.amazonaws.com',
    'Postman-Token': 'e2434f43-9cb0-4fef-9432-02c32cb4890b',
    'User-Agent': 'PostmanRuntime/7.15.0',
    Via: '1.1 3fb80f1162ff0374e396394904e92ee5.cloudfront.net (CloudFront)',
    'X-Amz-Cf-Id': 'h-M345yF6GFaRP92GUDDhyOfBWHvXpGzagkYfpUR3InjbH31mLflmQ==',
    'X-Amzn-Trace-Id': 'Root=1-5d21a645-0f40601bd42aedf5575b0ddc',
    'X-Forwarded-For': '115.188.84.216, 70.132.29.114',
    'X-Forwarded-Port': '443',
    'X-Forwarded-Proto': 'https',
  },
  multiValueHeaders: {
    Accept: ['*/*'],
    'Accept-Encoding': ['gzip, deflate'],
    Authorization: [
      'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik1FVTRNak5CUlRoRE56STJPVEZHUWpWRU5ESXhRekk1TVRWRU1EaERPRU0xTTBVMFJURkVNZyJ9.eyJodHRwczovL3RlYW1pbmcuY2xvdWQvand0L2NsYWltcyI6eyJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJ1c2VyIiwieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJ1c2VyIl0sIngtaGFzdXJhLXVzZXItaWQiOiJhdXRoMHw1ZDE5ZTY1NDhjZGE4NjBjY2M2NTIzYzIifSwiaXNzIjoiaHR0cHM6Ly90ZWFtaW5nLWNsb3VkLWRldi5hdS5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NWQxOWU2NTQ4Y2RhODYwY2NjNjUyM2MyIiwiYXVkIjoiU3Y0OG81NVcxTXN6RmdBdEM1M1gzTEF3V2xZamh0OVYiLCJpYXQiOjE1NjI0NjY1NjksImV4cCI6MTU2MjUwMjU2OSwiYXRfaGFzaCI6ImlkOWh1di1VbHFabTBDX19VcU1qWWciLCJub25jZSI6IlhxbVEwcTgueWx5eHpIZmdtSkEyczhwUlBZU2REaTVIIn0.4r-Cl_8kJzP49UQNWEMEf7692SdIlWn0KRtVisZIoqJzkv5nlIiYKbNdClgjC6_7wPSMDiG-K7hfn5vrR4N4h58RL96GkyZKObp7TOZWHGYWqv6j6_oMkLoU_1v_GkY4oDB8w92yXl74MxmXd8y7aV3I1415wyWSFJaYPJaBhF0hCWjU0iGNK_vmw3NhzIo-yhHV9P5JcB2x5B5nUbW_GcqObWAQ1KkWJ_juaPcYJguYLzrjoSA33851iWTIiDUPK_dXDzA_i99xyMySm15gWdI3HSHM6-UOdfo3xgIfSrnNL47ta5eh0hP4Yahi2eza9bIurW3dBhJnpMJ9_f35Kg',
    ],
    'Cache-Control': ['no-cache'],
    'CloudFront-Forwarded-Proto': ['https'],
    'CloudFront-Is-Desktop-Viewer': ['true'],
    'CloudFront-Is-Mobile-Viewer': ['false'],
    'CloudFront-Is-SmartTV-Viewer': ['false'],
    'CloudFront-Is-Tablet-Viewer': ['false'],
    'CloudFront-Viewer-Country': ['NZ'],
    Host: ['nkh2w77kh9.execute-api.us-east-1.amazonaws.com'],
    'Postman-Token': ['e2434f43-9cb0-4fef-9432-02c32cb4890b'],
    'User-Agent': ['PostmanRuntime/7.15.0'],
    Via: ['1.1 3fb80f1162ff0374e396394904e92ee5.cloudfront.net (CloudFront)'],
    'X-Amz-Cf-Id': ['h-M345yF6GFaRP92GUDDhyOfBWHvXpGzagkYfpUR3InjbH31mLflmQ=='],
    'X-Amzn-Trace-Id': ['Root=1-5d21a645-0f40601bd42aedf5575b0ddc'],
    'X-Forwarded-For': ['115.188.84.216, 70.132.29.114'],
    'X-Forwarded-Port': ['443'],
    'X-Forwarded-Proto': ['https'],
  },
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {
    resourceId: 'elyhmj',
    authorizer: {
      principalId: 'auth0|5d19e6548cda860ccc6523c2',
      integrationLatency: 1307,
      'https://teaming.cloud/jwt/claims':
        '{"x-hasura-default-role":"user","x-hasura-allowed-roles":["user"],"x-hasura-user-id":"auth0|5d19e6548cda860ccc6523c2"}',
    },
    resourcePath: '/company',
    httpMethod: 'POST',
    extendedRequestId: 'ccbq1E5aoAMFh7w=',
    requestTime: '07/Jul/2019:07:59:01 +0000',
    path: '/dev/company',
    accountId: '049606384301',
    protocol: 'HTTP/1.1',
    stage: 'dev',
    domainPrefix: 'nkh2w77kh9',
    requestTimeEpoch: 1562486341343,
    requestId: '14ed276c-a08d-11e9-9d7b-0554f297545d',
    // @ts-ignore
    identity: {
      cognitoIdentityPoolId: null,
      accountId: null,
      cognitoIdentityId: null,
      caller: null,
      sourceIp: '115.188.84.216',
      // @ts-ignore
      principalOrgId: null,
      accessKey: null,
      cognitoAuthenticationType: null,
      cognitoAuthenticationProvider: null,
      userArn: null,
      userAgent: 'PostmanRuntime/7.15.0',
      user: null,
    },
    domainName: 'nkh2w77kh9.execute-api.us-east-1.amazonaws.com',
    apiId: 'nkh2w77kh9',
  },
  body: null,
  isBase64Encoded: false,
});

const opts = {
  region: 'us-west-1',
  account: '123456789012',
  functionName: 'name',
  functionVersion: '$LATEST',
  memoryLimitInMB: '128',
  timeout: 3,
};

export const getMockContext = (): Context => {
  let end: number;

  const fail = (err: any) => {
    end = Date.now();

    if (typeof err === 'string') {
      err = new Error(err);
    }

    Promise.reject(err);
  };

  const succeed = (result: any) => {
    end = Date.now();

    Promise.resolve(result);
  };

  return {
    callbackWaitsForEmptyEventLoop: true,
    functionName: opts.functionName,
    functionVersion: opts.functionVersion,
    invokedFunctionArn: `arn:aws:lambda:${opts.region}:${opts.account}:function:${opts.functionName}:${opts.functionVersion}`,
    memoryLimitInMB: opts.memoryLimitInMB,
    awsRequestId: '111-222-333',
    logGroupName: `/aws/lambda/${opts.functionName}`,
    logStreamName: `fake-log-stream-name`,
    getRemainingTimeInMillis: () => {
      const start = Date.now();
      const endTime = end || Date.now();
      const remainingTime = opts.timeout * 1000 - (endTime - start);

      return Math.max(0, remainingTime);
    },
    succeed,
    fail,
    done: (err, result) => {
      if (err) {
        fail(err);
        return;
      }

      succeed(result);
    },
  };
};
