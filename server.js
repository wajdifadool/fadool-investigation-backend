const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

// Limit: 1 request per IP every 30 seconds
const limiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1,
  message: { error: 'Too many requests. Please try again later.' },
})

app.post('/api/contact', limiter, async (req, res) => {
  const { fullName, email, phone, message } = req.body

  if (
    fullName.length > 40 ||
    email.length > 40 ||
    phone.length > 20 ||
    message.length > 1000
  ) {
    return res.status(400).json({ error: 'Input too long' })
  }

  const messageSize = Buffer.byteLength(
    `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone} Message:${message}`,
    'utf8'
  )

  if (messageSize > 1000) {
    return res.status(400).json({ error: 'Message too large' })
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  })

  try {
    await transporter.sendMail({
      from: `"Website Contact Form" <${process.env.MAIL_USER}>`,
      to: `${process.env.MAIL_TO}`, // your business inbox
      subject: 'טופס יצירת קשר חדש - פדול חקירות',
      text: `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nmessage:${message}`,
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Email send error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
