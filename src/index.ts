/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function postToX(entry: { images: any; trailingText: any }) {
  // スクリプトプロパティからアクセストークンを取得
  const scriptProperties = PropertiesService.getScriptProperties();
  const bearerToken = scriptProperties.getProperty('bearerToken');

  if (!bearerToken) {
    throw new Error('bearerToken is not set in script properties.');
  }

  const url = 'https://api.twitter.com/2/tweets';
  const payload = {
    text: 'Test',
  };

  const params: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + bearerToken,
    },
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, params);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode === 200) {
    const jsonResponse = JSON.parse(responseBody);
    return jsonResponse; // Return the response from the API
  } else {
    Logger.log('Error posting to X: ' + responseBody);
    throw new Error('Failed to post entry to X: ' + responseBody);
  }
}
