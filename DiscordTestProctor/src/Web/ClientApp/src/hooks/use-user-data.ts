import { useEffect, useMemo, useState } from "react"

import { MeClient, MeVm } from "@/web-api-client"

export function useUserData() {
  const [userData, setUserData] = useState<MeVm | null>(null)
  const client = useMemo(() => new MeClient(), [])

  useEffect(() => {
    client
      .get()
      .then((data: MeVm) => {
        setUserData(data)
      })
      .catch((error) => {
        console.error("Error fetching user data:", error)
      })
  }, [client])

  return userData
}
