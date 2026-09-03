"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { NavGroup } from "./nav-items";
import { isActiveNavGroup, isActiveNavItem } from "./nav-items";

type DesktopNavMenuProps = {
  group: NavGroup;
  pathname: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DesktopNavMenu({ group, pathname, open, onOpenChange }: DesktopNavMenuProps) {
  const active = isActiveNavGroup(pathname, group);

  return (
    <Menu.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Menu.Trigger className={`nav-link nav-menu-trigger ${active ? "active" : ""}`} data-cursor="hover">
        {group.name}
        <ChevronDown aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="nav-menu-positioner" sideOffset={18} align="end">
          <Menu.Popup className={`nav-menu-popup nav-menu-popup--${group.id}`}>
            <div className="nav-menu-intro">
              <span>{group.name}</span>
              <p>{group.description}</p>
            </div>
            <div className="nav-menu-sections">
              {group.sections.map((section) => (
                <Menu.Group className="nav-menu-section" key={section.id}>
                  <Menu.GroupLabel className="nav-menu-section-label">
                    <span>{section.name}</span>
                    <small>{section.description}</small>
                  </Menu.GroupLabel>
                  <div className="nav-menu-links">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const itemActive = isActiveNavItem(pathname, item);
                      return (
                        <Menu.LinkItem
                          key={item.id}
                          render={<Link href={item.href} />}
                          closeOnClick
                          className={`nav-menu-link ${itemActive ? "active" : ""}`}
                          aria-current={itemActive ? "page" : undefined}
                          data-cursor="hover"
                        >
                          <span className="nav-menu-icon"><Icon aria-hidden="true" /></span>
                          <span className="nav-menu-copy">
                            <strong>{item.name}{item.beta && <sup>beta</sup>}</strong>
                            <small>{item.description}</small>
                          </span>
                        </Menu.LinkItem>
                      );
                    })}
                  </div>
                </Menu.Group>
              ))}
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
