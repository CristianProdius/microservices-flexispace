"use client";

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import useAuthStore from "@/stores/authStore";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

const AddBookingSchema = z
  .object({
    spaceId: z
      .string()
      .min(1, "Space ID is required")
      .regex(/^\d+$/, "Space ID must be numeric"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    isHourly: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    guests: z
      .string()
      .regex(/^\d+$/, "Guests must be a positive integer")
      .optional(),
    message: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.isHourly && (!value.startTime || !value.endTime)) {
      ctx.addIssue({
        code: "custom",
        message: "Start and end time are required for hourly bookings",
        path: ["startTime"],
      });
    }
  });

type AddBookingFormData = z.infer<typeof AddBookingSchema>;

interface AddBookingProps {
  onCreated?: () => void;
}

const AddBooking = ({ onCreated }: AddBookingProps) => {
  const form = useForm<AddBookingFormData>({
    resolver: zodResolver(AddBookingSchema),
    defaultValues: {
      spaceId: "",
      startDate: "",
      endDate: "",
      isHourly: false,
      startTime: "",
      endTime: "",
      guests: "1",
      message: "",
    },
  });

  const { getToken } = useAuthStore();

  const mutation = useMutation({
    mutationFn: async (data: AddBookingFormData) => {
      const token = await getToken();
      const payload = {
        spaceId: Number(data.spaceId),
        startDate: data.startDate,
        endDate: data.endDate,
        isHourly: data.isHourly,
        guests: data.guests ? Number(data.guests) : 1,
        ...(data.isHourly && data.startTime ? { startTime: data.startTime } : {}),
        ...(data.isHourly && data.endTime ? { endTime: data.endTime } : {}),
        ...(data.message ? { message: data.message } : {}),
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/bookings`,
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        let message = "Failed to create booking";
        try {
          const error = await res.json();
          message = error.message || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
    },
    onSuccess: () => {
      toast.success("Booking created successfully");
      form.reset();
      onCreated?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isHourly = form.watch("isHourly");

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Add Booking</SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form
              className="space-y-8"
              onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            >
              <FormField
                control={form.control}
                name="spaceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Space ID</FormLabel>
                    <FormControl>
                      <Input {...field} inputMode="numeric" />
                    </FormControl>
                    <FormDescription>
                      Numeric ID of the space to book.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isHourly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly booking</FormLabel>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="ml-2 align-middle"
                      />
                    </FormControl>
                    <FormDescription>
                      Check to book by the hour instead of full days.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isHourly && (
                <>
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <FormField
                control={form.control}
                name="guests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guests</FormLabel>
                    <FormControl>
                      <Input {...field} inputMode="numeric" />
                    </FormControl>
                    <FormDescription>Number of guests (default 1).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Optional message to the host.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default AddBooking;
