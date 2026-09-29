import { staffItemSchema } from "./schema";
import type { StaffSource } from "./source";

// Entirely fake people and addresses. `.invalid` is a reserved TLD that can never
// resolve, so none of these can reach a real inbox.
const FAKE_STAFF = [
  {
    id: "1",
    name: "Dr. Mona Farouk",
    title: "Associate Professor",
    department: "Computer Science",
    email: "mona.farouk@staff.example-guc.invalid",
    office: "C7.312",
    officeHours: "Sun & Tue, 11:00–13:00",
    courses: ["CSEN 401"],
  },
  {
    id: "2",
    name: "Dr. Karim Adel",
    title: "Assistant Professor",
    department: "Mathematics",
    email: "karim.adel@staff.example-guc.invalid",
    office: "C6.210",
    officeHours: "Mon & Wed, 10:00–12:00",
    courses: ["MATH 251"],
  },
  {
    id: "3",
    name: "Dr. Salma Hegazy",
    title: "Professor",
    department: "Computer Science",
    email: "salma.hegazy@staff.example-guc.invalid",
    office: "C7.318",
    officeHours: "Thu, 09:00–12:00",
    courses: ["CSEN 403"],
  },
  {
    id: "4",
    name: "Eng. Omar Nabil",
    title: "Teaching Assistant",
    department: "Digital Media",
    email: "omar.nabil@staff.example-guc.invalid",
    office: "B2.105",
    officeHours: "By appointment",
    courses: ["DMET 301", "CSEN 403"],
  },
  {
    id: "5",
    name: "Dr. Layla Samir",
    title: "Lecturer",
    department: "Humanities",
    email: "layla.samir@staff.example-guc.invalid",
    office: "D1.020",
    officeHours: "Tue, 13:00–15:00",
    courses: ["ENGD 301"],
  },
];

export const mockStaffSource: StaffSource = {
  async fetch() {
    return FAKE_STAFF.map((person) => staffItemSchema.parse(person));
  },
};
