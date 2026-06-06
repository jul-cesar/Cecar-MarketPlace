import {
  Armchair,
  Bike,
  BookOpen,
  GraduationCap,
  Laptop,
  LayoutGrid,
  Shirt,
  type LucideIcon,
} from "lucide-react"
import type { CategoryResponse } from "@/lib/mock-marketplace"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const iconByName: Record<string, LucideIcon> = {
  Armchair,
  Bike,
  BookOpen,
  GraduationCap,
  Laptop,
  Shirt,
}

interface CategoryRailProps {
  categories: CategoryResponse[]
  selectedCategory: string
  listingCountByCategory: Record<string, number>
  onSelectCategory: (slug: string) => void
}

export function CategoryRail({
  categories,
  selectedCategory,
  listingCountByCategory,
  onSelectCategory,
}: CategoryRailProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <CategoryButton
        label="Todo"
        count={categories.reduce(
          (total, category) => total + (listingCountByCategory[category.slug] ?? 0),
          0
        )}
        isActive={selectedCategory === "all"}
        onClick={() => onSelectCategory("all")}
        Icon={LayoutGrid}
      />
      {categories.map((category) => (
        <CategoryButton
          key={category.id}
          label={category.name}
          count={listingCountByCategory[category.slug] ?? 0}
          isActive={selectedCategory === category.slug}
          onClick={() => onSelectCategory(category.slug)}
          Icon={category.icon ? iconByName[category.icon] ?? LayoutGrid : LayoutGrid}
        />
      ))}
    </div>
  )
}

interface CategoryButtonProps {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
  Icon: LucideIcon
}

function CategoryButton({ label, count, isActive, onClick, Icon }: CategoryButtonProps) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "outline"}
      className={cn(
        "h-auto min-w-fit rounded-2xl px-4 py-3 transition-all",
        !isActive && "bg-background/70"
      )}
      onClick={onClick}
    >
      <Icon className="size-4" />
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs",
          isActive ? "bg-primary-foreground/15" : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </Button>
  )
}
