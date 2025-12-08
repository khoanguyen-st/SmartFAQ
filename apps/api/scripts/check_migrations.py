#!/usr/bin/env python3
"""
Script to check for multiple migration heads and auto-merge if needed.

Usage:
    python scripts/check_migrations.py --check        # Only check, exit 1 if multiple heads
    python scripts/check_migrations.py --auto-merge   # Auto merge if multiple heads found
    python scripts/check_migrations.py --verbose      # Show detailed info
"""

import argparse
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple, List


class MigrationChecker:
    """Check and manage Alembic migration heads."""

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.api_dir = Path(__file__).parent.parent

    def run_alembic_command(self, *args) -> Tuple[int, str, str]:
        """Run alembic command and return exit code, stdout, stderr."""
        cmd = ["alembic"] + list(args)
        if self.verbose:
            print(f"Running: {' '.join(cmd)}")

        result = subprocess.run(
            cmd,
            cwd=self.api_dir,
            capture_output=True,
            text=True,
        )
        return result.returncode, result.stdout, result.stderr

    def get_heads(self) -> List[str]:
        """Get list of current migration heads."""
        returncode, stdout, stderr = self.run_alembic_command("heads")

        if returncode != 0:
            print(f"❌ Error getting heads: {stderr}")
            sys.exit(1)

        # Parse output to get revision IDs
        heads = []
        for line in stdout.strip().split("\n"):
            if line.strip():
                # Format: "abc123 (head)" or "abc123"
                rev_id = line.split()[0]
                if rev_id and len(rev_id) >= 12:  # Alembic revision IDs
                    heads.append(rev_id)

        return heads

    def get_current_revision(self) -> Optional[str]:
        """Get current database revision."""
        returncode, stdout, _ = self.run_alembic_command("current")
        if returncode != 0:
            return None

        for line in stdout.strip().split("\n"):
            if line.strip():
                return line.split()[0]
        return None

    def check_multiple_heads(self) -> bool:
        """Check if there are multiple heads. Returns True if multiple heads exist."""
        heads = self.get_heads()

        if len(heads) <= 1:
            if self.verbose:
                if heads:
                    print(f"✅ Single head found: {heads[0]}")
                else:
                    print("ℹ️  No heads found (empty migration history)")
            return False

        print(f"⚠️  Multiple heads detected ({len(heads)}):")
        for i, head in enumerate(heads, 1):
            print(f"  {i}. {head}")

        return True

    def show_history(self):
        """Show migration history."""
        print("\n📜 Migration History:")
        print("=" * 70)
        returncode, stdout, _ = self.run_alembic_command("history")
        if returncode == 0:
            print(stdout)
        else:
            print("Unable to retrieve history")

    def auto_merge(self) -> bool:
        """Automatically merge multiple heads if they exist."""
        heads = self.get_heads()

        if len(heads) <= 1:
            print("✅ No merge needed - single head or no migrations")
            return True

        print(f"\n🔀 Auto-merging {len(heads)} heads...")

        # Generate merge message with timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        merge_msg = f"merge multiple heads - {timestamp}"

        # Construct merge command
        merge_args = ["merge", "-m", merge_msg] + heads

        returncode, stdout, stderr = self.run_alembic_command(*merge_args)

        if returncode != 0:
            print(f"❌ Merge failed: {stderr}")
            return False

        print(stdout)
        print("✅ Merge revision created successfully!")

        # Show the new state
        new_heads = self.get_heads()
        if len(new_heads) == 1:
            print(f"✅ Now at single head: {new_heads[0]}")
            return True
        else:
            print("⚠️  Still have multiple heads after merge")
            return False

    def validate_migration_chain(self) -> bool:
        """Validate that migration chain is intact."""
        print("\n🔍 Validating migration chain...")

        # Check that we can upgrade to head
        returncode, stdout, stderr = self.run_alembic_command(
            "upgrade",
            "head",
            "--sql",  # Dry run
        )

        if returncode != 0:
            print(f"❌ Migration chain validation failed: {stderr}")
            return False

        print("✅ Migration chain is valid")
        return True


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Check and manage Alembic migration heads"
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Only check for multiple heads (exit 1 if found)",
    )
    parser.add_argument(
        "--auto-merge",
        action="store_true",
        help="Automatically merge multiple heads if found",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Validate migration chain integrity",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show verbose output",
    )
    parser.add_argument(
        "--show-history",
        action="store_true",
        help="Show migration history",
    )

    args = parser.parse_args()

    checker = MigrationChecker(verbose=args.verbose)

    # Show history if requested
    if args.show_history:
        checker.show_history()
        return

    # Check for multiple heads
    has_multiple_heads = checker.check_multiple_heads()

    # Handle different modes
    if args.check:
        # Check only mode - exit with error if multiple heads
        if has_multiple_heads:
            print("\n❌ Multiple migration heads detected!")
            print("Please run: make migration-merge")
            print("Or: python scripts/check_migrations.py --auto-merge")
            sys.exit(1)
        else:
            print("✅ Migration check passed - single head")
            sys.exit(0)

    elif args.auto_merge:
        # Auto-merge mode
        if has_multiple_heads:
            success = checker.auto_merge()
            sys.exit(0 if success else 1)
        else:
            print("✅ No merge needed")
            sys.exit(0)

    elif args.validate:
        # Validate mode
        is_valid = checker.validate_migration_chain()
        sys.exit(0 if is_valid else 1)

    else:
        # Default: just show status
        if has_multiple_heads:
            print("\n💡 Tip: Use --auto-merge to automatically merge heads")
            print("Or run: make migration-merge")
            sys.exit(1)
        else:
            sys.exit(0)


if __name__ == "__main__":
    main()