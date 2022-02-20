import { prompt } from 'inquirer'
import { GoogleSpreadsheet } from 'google-spreadsheet'

import { config } from 'dotenv'
config({ path: `.env` })

export const { CREDS_PATH, SHEET_ID } = process.env

class Cli {
  private sheet = null

  constructor() {
    this.initSheet()
  }

  public async initSheet(): Promise<void> {
    try {
      const doc = new GoogleSpreadsheet(SHEET_ID)
      const creds = require(CREDS_PATH)

      await doc.useServiceAccountAuth(creds)
      await doc.loadInfo()
      const date = new Date()
      let month: any = date.getMonth() + 1
      let day: any = date.getDate()

      month = month >= 10 ? month : '0' + month
      day = day >= 10 ? day : '0' + day

      const sheetName = `${date.getFullYear()}-${month}-${day}`

      if (doc.sheetsByTitle[sheetName] === undefined) {
        this.sheet = await doc.addSheet({
          title: sheetName,
          headerValues: ['name', 'date', 'type', 'price', 'note'],
        })
      } else {
        this.sheet = doc.sheetsByTitle[sheetName]
      }
      return
    } catch (e) {
      console.log(e)
    }
  }

  private dateFormat(date) {
    let month = date.getMonth() + 1
    let day = date.getDate()
    let hour = date.getHours()
    let minute = date.getMinutes()
    let second = date.getSeconds()

    month = month >= 10 ? month : '0' + month
    day = day >= 10 ? day : '0' + day
    hour = hour >= 10 ? hour : '0' + hour
    minute = minute >= 10 ? minute : '0' + minute
    second = second >= 10 ? second : '0' + second

    return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second
  }

  public async run() {
    while (true) {
      const userInput = await prompt([
        {
          type: 'string',
          name: 'data',
          message: `QR 코드를 스캔해주세요.\n* (QR 코드 리더기의 정확한 인식을 위해) 컴퓨터 자판은 영어로 설정해주세요.\n* (종료하시려면, 0번을 누르세요.) >>>`,
        },
      ])

      switch (userInput.data) {
        case '0':
          return
        default:
          const base64 = require('base-64')
          const utf8 = require('utf8')
          const bytes = base64.decode(userInput.data)
          const decodedData = utf8.decode(bytes)

          console.log(decodedData)
          const data = JSON.parse(decodedData)
          try {
            const now = new Date() // 현재 시간
            const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000 // 현재 시간을 utc로 변환한 밀리세컨드값
            const koreaTimeDiff = 9 * 60 * 60 * 1000 // 한국 시간은 UTC보다 9시간 빠름(9시간의 밀리세컨드 표현)
            const koreaNow = new Date(utcNow + koreaTimeDiff)

            await this.sheet.addRow({ name: data.userName, date: this.dateFormat(koreaNow), type: '', price: '', note: '' })

            process.stdout.write('\u001b[2J\u001b[0;0H')
            console.log(`${data.userName}님 출석 처리 완료\n출석 처리 시간 ${this.dateFormat(koreaNow)}`)
          } catch (err) {
            console.log(err)
          }
      }
    }
  }
}

const cli = new Cli()

cli.run()
