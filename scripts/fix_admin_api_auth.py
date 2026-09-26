# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"c:\Users\X1 Carbon\Desktop\dk-meuble\frontend\lib\adminApi.ts")
t = p.read_text(encoding="utf-8")

# Remove unused getCookie
start = t.find("function getCookie(name: string)")
if start != -1:
    end = t.find("const ADMIN_TOKEN_KEY", start)
    if end != -1:
        t = t[:start] + t[end:]

t = t.replace("    await ensureCsrf();\n", "")
t = t.replace('credentials: "include"', 'credentials: "omit"')

replacements = [
    (
        '    const headers: Record<string, string> = { Accept: "application/json" };\n'
        '    const xsrf = getCookie("XSRF-TOKEN");\n'
        '    if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;\n',
        "    const headers = authHeaders();\n",
    ),
    (
        '    const headers: Record<string, string> = { Accept: "application/pdf" };\n'
        '    const xsrf = getCookie("XSRF-TOKEN");\n'
        '    if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;\n',
        '    const headers = authHeaders({ Accept: "application/pdf" });\n',
    ),
    (
        '    const headers: Record<string, string> = { Accept: "text/csv" };\n'
        '    const xsrf = getCookie("XSRF-TOKEN");\n'
        '    if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;\n',
        '    const headers = authHeaders({ Accept: "text/csv" });\n',
    ),
]
for a, b in replacements:
    t = t.replace(a, b)

old401_a = """    if (res.status === 401) {
      setAdminToken(null);
      if (typeof window !== "undefined") window.location.href = "/admin/login";
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }"""
old401_b = """    if (res.status === 401) {
      if (typeof window !== "undefined") window.location.href = "/admin/login";
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }"""
new401 = """    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }"""
t = t.replace(old401_a, new401)
t = t.replace(old401_b, new401)

# If some blocks still only have `const headers = authHeaders()` from earlier edits, good.
# Fix any leftover `const headers: Record... = { Accept` without Bearer
import re

def add_auth(m):
    accept = m.group(1)
    if accept == "application/json":
        return "    const headers = authHeaders();\n"
    return f'    const headers = authHeaders({{ Accept: "{accept}" }});\n'

t = re.sub(
    r'    const headers: Record<string, string> = \{ Accept: "([^"]+)" \};\n',
    add_auth,
    t,
)

p.write_text(t, encoding="utf-8")
print("ensureCsrf", t.count("ensureCsrf"))
print("include", t.count('credentials: "include"'))
print("getCookie", t.count("getCookie"))
print("omit", t.count('credentials: "omit"'))
