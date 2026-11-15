import { siteConfig, type ContactDetails } from '../config.ts'

interface ContactInfoProps {
  contact?: ContactDetails
}

function ContactInfo({ contact = siteConfig.contact }: ContactInfoProps) {
  const discordUrl = `https://discord.com/users/${encodeURIComponent(contact.discordUserId)}`
  const robloxUrl = `https://www.roblox.com/users/profile?username=${encodeURIComponent(contact.robloxUsername)}`

  return (
    <div className="mt-4">
      <ul aria-label="Contact links" className="list-unstyled mb-0 d-flex flex-column gap-2">
        <li>
          <a href={discordUrl} target="_blank" rel="noreferrer">
            Discord
          </a>
        </li>
        <li>
          <a href={robloxUrl} target="_blank" rel="noreferrer">
            Roblox Profile
          </a>
        </li>
      </ul>
    </div>
  )
}

export default ContactInfo
