import smtplib

server = smtplib.SMTP("smtp.gmail.com", 587)
server.starttls()
server.login("vinitokada@gmail.com", "poaw ttgf yfmc mbjl")
print("LOGIN OK")

server.sendmail(
    "vinitokada@gmail.com",
    "vinitokada@gmail.com",
    "Subject: Teste\n\nEmail funcionando"
)
print("EMAIL ENVIADO")

server.quit()
