import importlib
import mimetypes
import smtplib
import ssl
import sys
from email.message import EmailMessage
from pathlib import Path

import yaml
from jinja2 import Template, TemplateError, Undefined

from egapro import db
from egapro.constants import DEPARTEMENT_TO_REGION, REGIONS_TO_DEPARTEMENTS

from .. import config
from ..loggers import logger


ACCESS_GRANTED = """Bonjour,

Voici le lien vous permettant de valider votre email:

{link}

L'équipe Egapro
"""

REPLY_TO = {}


# Never fail when a deep attribute is missing (eg. indicateurs.rémunérations.note)
class SilentUndefined(Undefined):
    def _fail_with_undefined_error(self, *args, **kwargs):
        return None


def send(to, subject, txt, html=None, reply_to=None, attachment=None):
    msg = EmailMessage()
    msg["From"] = config.FROM_EMAIL
    msg["To"] = to
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(txt)
    if html:
        msg.add_alternative(html, subtype="html")
    if attachment:
        blob, filename = attachment
        if callable(blob):
            blob = blob()
        ctype, encoding = mimetypes.guess_type(filename)
        maintype, subtype = ctype.split("/", 1)
        msg.add_attachment(blob, maintype=maintype, subtype=subtype, filename=filename)
    if not config.SEND_EMAILS:
        print("Sending email", str(msg))
        print("email txt:", txt)
        return
    context = ssl.create_default_context()
    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as server:
        if config.SMTP_SSL:
            server.starttls(context=context)
        try:
            if config.SMTP_LOGIN:
                server.login(config.SMTP_LOGIN, config.SMTP_PASSWORD)
            server.send_message(msg)
        except smtplib.SMTPException as err:
            raise RuntimeError from err
        else:
            logger.debug(f"Email sent to {to}: {subject}")


class Email:
    def __init__(self, subject, txt, html, attachment):
        self.subject = self.load(subject)
        self.txt = self.load(txt)
        self.html = self.load(html)
        self.attachment = attachment

    def send(self, to, **context):
        txt, html, subject = self(**context)
        reply_to = REPLY_TO.get(context.get("departement"))
        attachment = None
        if self.attachment:
            attachment = self.attachment(context)
        send(to, subject, txt, html, reply_to=reply_to, attachment=attachment)

    def __call__(self, **context):
        return (
            self.txt.render(**context),
            (self.html or "").render(**context),
            (self.subject or "").render(**context).replace("\r", "").replace("\n", ""),
        )

    def load(self, s):
        try:
            return Template(
                s or "", undefined=SilentUndefined, trim_blocks=True, lstrip_blocks=True
            )
        except TemplateError as err:
            print(s)
            sys.exit(err)


def load():
    """Load templates, in order to do `emails.success.send()` for a template named
    `success`."""
    root = Path(__file__).parent
    for path in root.iterdir():
        if path.is_dir() and not path.name.startswith("_"):
            subject = (path / "subject.txt").read_text()
            txt = (path / "body.txt").read_text()
            html = path / "body.html"
            if html.exists():
                html = html.read_text()
            else:
                html = None
            attachment = None
            pymodule = path / "__init__.py"
            if pymodule.exists():
                pymodule = importlib.import_module(f"egapro.emails.{path.name}")
                attachment = pymodule.attachment
            globals()[path.name] = Email(subject, txt, html, attachment)

    REPLY_TO.update(yaml.safe_load((root / "reply_to.yml").read_text()))

async def getReplyTo(county: str):
    region = DEPARTEMENT_TO_REGION[county]
    ref = await db.referent.getByCounty(county)
    if (len(ref) === 0)


load()

"""
get list by county
filter list by principal

"""
