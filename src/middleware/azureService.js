/* import axios from 'axios';
 import {ConfidentialClientApplication}  from '@azure/msal-node';
// const { PublicClientApplication } = require("@azure/msal-node");
//const {axios} = require('axios');

const apiUrl = 'https://graph.microsoft.com/v1.0/me/sendMail';
  
const msalConfig = {
  auth: {
    //clientId: "be5c0edd-fa3d-4ba8-8bad-9a0a0d367ee9",
    clientId: "272b2615-0297-4443-b712-8c9e80486252",
    //authority: "https://login.microsoftonline.com/339b661c-15dc-4fdc-9c47-66f74d5eb137",
    authority: "https://login.microsoftonline.com/f8cdef31-a31e-4b4a-93e4-5f571e91255a",
    //clientSecret: "OA98Q~H00qO.rEDRwGyD5gyTBPe9ZNJXnd-z~cP3",
    clientSecret: "ki_8Q~TJscB4n9e4oSfkQyfpkoEyLKEk_Myn~bmT"
  },
};

const msalInstance =  new ConfidentialClientApplication(msalConfig);
// const msalInstance = new PublicClientApplication(msalConfig);

const tokenRequest = {
  scopes: ["https://graph.microsoft.com/.default"], // Replace with the appropriate scope
  // scopes: ["https://outlook.office365.com/.default"], // Replace with the appropriate scope
};

export  async function getToken()   {
  try {
    const authResult = await msalInstance.acquireTokenByClientCredential(tokenRequest);
    const accessToken = authResult.accessToken;
    console.log("Access token:", accessToken);
    // Now you can use the access token for Microsoft Graph API requests
  } catch (error) {
    console.error("Error acquiring token:", error);
  }
};

export  async function sendEmail(accessToken, emailAddr) {

    const emailData = {
      message: {
        subject: 'Disponibilidade de Material',
        body: {
          contentType: 'Text',
          content: 'Recebeu este email porque tem material disponivel para Requisicao no Armazem. Por favor acesse o sistema no seguinte endereco: http://localhost:3000/ para fazer uma requisicao.',
        },
        toRecipients: [
          {
            emailAddress: {
              address: emailAddr,
            },
          },
        ],
      },
    };
  
    try {
      const response = await axios.post(apiUrl, emailData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (response.status === 202) {
        console.log('Email sent successfully');
      } else {
        console.error('Failed to send email:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
  
 */