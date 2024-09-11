import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

export async function emailAWS({
  address,
  data,
  subject,
}: {
  address: string[]
  data: string
  subject: string
}) {
  const client = new SESClient([{
    region: 'eu-north-1',
    credentials: {
      accessKeyId: process.env.EMAIL_ACCESS_KEY_ID,
      secretAccessKey: process.env.EMAIL_SECRET_ACCESS_KEY,
    },
  }])

  const command = new SendEmailCommand({
    Source: 'noreply@takin.ai',
    Destination: {
      ToAddresses: address,
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: data,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
  })
  try {
    return await client.send(command)
  }
  catch (e) {
    console.error(e)
    return e
  }
}
