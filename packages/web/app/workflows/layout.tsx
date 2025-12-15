import { Header } from "@/components/header"
import { SidebarInset } from "@/components/ui/sidebar"
import { CreateWorkflowButton } from "./create-workflow-button"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset>
      <Header title="Workflows" actions={<CreateWorkflowButton />} />
      {children}
    </SidebarInset>
  )
}
